const express = require("express");
const {sq,testDbConnection} = require('./databaseStructure/dbconnection')
const user = require('./databaseStructure/user.modal')
const dotenv = require("dotenv");
const axios= require("axios");
const auntendicationService = require("./auntendication.service");
const app = express();
dotenv.config();
const auntendicationServiceFile = new auntendicationService();
const PORT = process.env.PORT ? process.env.PORT : 3000;
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "testAccessToken";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "testRefreshToken";
const accountSid = process.env.ACCS_ID;
const authToken = process.env.AUTHTOKEN;
app.use(express.json());
let users = [];
let refreshTokens = [];
let OtpToken = [];
//connect db
testDbConnection()
app.post("/sendOTP", async (req, res) => {
  let token = "";
  for (let index = 1; index < 7; index++) {
    token += Math.floor(Math.random() * 10).toString();
  }

  let userDataIndex = OtpToken.findIndex((user) => user.mobileDeviceID == req.body.mobileDeviceID);

  if (userDataIndex >= 0) {
    if (OtpToken[userDataIndex]?.count > 3) {
      // Respond and return if the limit is reached
      return res.status(200).json({ mobileDeviceID: req.body.mobileDeviceID, limit: 'reached' });
    }
    OtpToken[userDataIndex].count += 1;
    OtpToken[userDataIndex].token += token;
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

app.post("/authendicate",async(req, res) => {

  try{
    let userdata = OtpToken.findIndex((user) => user.phNo == req.body.phNo);
    console.log(userdata,"userDAta")
    if (userdata >= 0) {
      if (OtpToken[userdata].token == req.body.token) {
        let newUser
        let checkExistingUser = await auntendicationServiceFile.findUser(
          userCred.phNo
        );
        console.log(checkExistingUser,"checkExistingUser")
        if(checkExistingUser.length == 0){
          console.log(checkExistingUser,"checkExistingUser")
          newUser = await auntendicationServiceFile.createUser(
            userCred
          );
          checkExistingUser = newUser
        }
        OtpToken.splice(0, userdata);
        if(checkExistingUser.length || newUser){
          console.log("access token generated ")
          let token = await auntendicationServiceFile.generateAccessToken(checkExistingUser)
          res.status(200).json({ status: "sucess", user: checkExistingUser,token : token });
        }else{
          res.status(500).json({ status :"some thing went wrong" });
        }

        
      
      } else {
        res.status(401).json({ status: "invalid token" });
      }
    } else {
      res.status(401).json({ status: "invalid phone number" });
    }
  }catch{(e)=>{
    res.send(500).json({error : e})
  }}
 
});

app.post("/register", async (req, res) => {
  this.sendOtp(req, res);
  const userCred = req.body;
  try{
    let checkExistingUser = await auntendicationServiceFile.findUser(
      userCred.phNo
    );
    if (checkExistingUser.length) {
      let cred = req.body 
      cred.updatedAt = Date.now()
      let status = await auntendicationServiceFile.updateUser(cred);
      res.status(200).json(status);
    }else{
      res.status(201).json({status : "user not found"});
    }
  }catch{
    (e)=>{
      res.send(500).json({error : e})
    }
  }
  
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = auntendicationServiceFile.findUser(email);
  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  } else {
    const issueTokenStatus = await auntendicationServiceFile.autendicate(
      req.body,
      res
    );
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

app.post("/jobAvailabbility", (req, res) => {
  let params = req.body;
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
  axios.get(
    "https://www.naukri.com/jobapi/v3/search?noOfResults=20&urlType=search_by_keyword&searchType=adv&keyword=mechanical&pageNo=1&experience=0&k=mechanical&experience=0&seoKey=mechanical-jobs&src=jobsearchDesk&latLong=",
    options).then((value)=>{
      res.status(200).json(value.data)
    }).catch((e)=>{
      res.status(500).json({status :"something went wrong while fetching"})
    });
});

app.post("/logout", (req, res) => {
  const { token } = req.body;
  refreshTokens = auntendicationServiceFile.refreshTokens.filter(
    (t) => t !== token
  );
  res.status(204).json({ message: "Logout successful" });
});

app.post(
  "/test",
  auntendicationServiceFile.authenticateAccessToken,
  (req, res) => {
    console.log("sucess");
    res.sendStatus(200);
  }
);
app.listen(PORT, (status) => {
  if (!status) {
    console.log("listening port", PORT);
  } else {
    console.log("error", status);
  }
});
