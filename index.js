const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const axios= require("axios");
const auntendicationService = require("./auntendication.service");
const admin = require("firebase-admin");
const functions = require("firebase-functions");
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

try {
  console.log(accountSid, "accountSid");
} catch {
  (e) => {
    console.log(e, "error");
  };
}

app.use(express.json());
let users = [];
let refreshTokens = [];
let OtpToken = [];

app.post("/authendicatePhonenumber", async (req, res) => {
  let token = "";
  for (let index = 1; index < 7; index++) {
    token += Math.floor(Math.random() * 10).toString();
  }
  console.log(token, "Token..");
  let usersToken = {
    phNo: req.body.phNo,
    token: token,
  };
  OtpToken.push(usersToken);
  try {
    console.log(accountSid, authToken, req.body.phNo);
    const client = require("twilio")(accountSid, authToken);
    client.messages
      .create({
        body: "Hello, this is your OTP code: " + token, // Add the message body
        messagingServiceSid: "MGce4e11f9472ccfc5cd2fc74f24632adf", // Replace with a valid Twilio number
        to: req.body.phNo,
        from: "+1 251 320 6256",
      })
      .then((message) => {
        console.log(message, "message..");
        res
          .status(200)
          .json({ phNo: req.body.phNo, status: "issued sucessfully" });
      })
      .catch((e) => {
        console.log(e, "error");
      });
  } catch {
    (e) => {
      res.status(500).json({ err: "something went wrong" });
    };
  }
});

app.post("/validatePhonenumber", (req, res) => {
  let userdata = OtpToken.findIndex((user) => user.phNo == req.body.phNo);
  if (userdata >= 0) {
    if (OtpToken[userdata].token == req.body.token) {
      res.status(200).json({ status: "sucess" });
      OtpToken.splice(0, userdata);
    } else {
      res.status(401).json({ status: "invalid token" });
    }
  } else {
    res.status(401).json({ status: "invalid phone number" });
  }
});

app.post("/register", async (req, res) => {
  this.sendOtp(req, res);
  const userCred = req.body;
  let checkExistingUser = await auntendicationServiceFile.findUser(
    userCred.email
  );
  if (checkExistingUser) {
    return res.status(400).json({ message: "User already exists" });
  } else {
    let status = await auntendicationServiceFile.addUser(userCred);
    res.status(201).json(status);
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
