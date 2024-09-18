import { Router } from 'express'
import { OtpTokentype } from '../utils/login.utils.js';
import redisCon from '../DBConnections/redisConnection.js';
import JWTAuthendication from '../auntendication.service.js';
const loginRouter = Router();

/**
 * @swagger
 * /sendOTP:
 *   post:
 *     tags:
 *       - OTP API
 *     summary: Send OTP to mobile device
 *     description: This route sends OTP to mobile device using Twilio API
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phNo
 *               - mobileDeviceID
 *             properties:
 *               phNo:
 *                 type: string
 *                 description: Phone number
 *               mobileDeviceID:
 *                 type: string
 *                 description: Mobile device ID
 *     responses:
 *       200:
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   default: 200|429|500
 *                 phNo:
 *                   type: string
 *                   description: Phone number
 *                 message:
 *                   type: string
 *                   description: "Error or success message depends on status code"
 */

loginRouter.post("/sendOTP", async (req, res) => {
    try {
        let token = "";
        for (let index = 1; index < 7; index++) {
            token += Math.floor(Math.random() * 10).toString();
        }
        const OtpToken: OtpTokentype = (await redisCon.lrange("otpToken", 0, -1)).map(token => JSON.parse(token));
        let userDataIndex = OtpToken.findIndex((user) => user.mobileDeviceID == req.body.mobileDeviceID);

        if (userDataIndex >= 0) {
            if (OtpToken[userDataIndex]?.count > 3) {
                // Respond and return if the limit is reached
                return res.status(200).json({ status: 429, mobileDeviceID: req.body.mobileDeviceID, message: "limit reached" });
            }
            OtpToken[userDataIndex].count += 1;
            OtpToken[userDataIndex].token = token;
            redisCon.lset("otpToken", userDataIndex, JSON.stringify(OtpToken[userDataIndex]))
        } else {

            redisCon.rpush("otpToken", JSON.stringify({
                phNo: req.body.phNo,
                mobileDeviceID: req.body.mobileDeviceID,
                token: token,
                count: 1
            }));
        }



        const client = require("twilio")(process.env.ACCS_ID, process.env.AUTHTOKEN);
        await client.messages.create({
            body: "Hello, this is your OTP code: " + token, // Add the message body
            messagingServiceSid: "MGce4e11f9472ccfc5cd2fc74f24632adf", // Replace with a valid Twilio number
            to: req.body.phNo,
            from: "+1 251 320 6256",
        });

        // Respond after the Twilio API call is successful
        res.status(200).json({ status: 200, phNo: req.body.phNo, message: "issued successfully" });

    } catch (e) {
        // Handle errors and respond with 500 status
        console.log(e, "error");
        res.status(200).json({ status: 500, message: "unable to complete your request", err: "something went wrong" });
    }
});



loginRouter.post("/authendicateOTP", async (req, res) => {
    try {
        const otpTokens = (await redisCon.lrange("otpToken", 0, -1)).map(token => JSON.parse(token));
        const userData = otpTokens.findIndex(user => user.phNo === req.body.phNo);

        if (userData >= 0) {
            const existingUser = await JWTAuthendication.findUser(req.body.phNo);

            if (otpTokens[userData].token === req.body.token) {
                await redisCon.lrem("otpToken", -1, JSON.stringify(otpTokens[userData]));
                if (!existingUser || existingUser.length === 0) {
                    const newUser = await JWTAuthendication.createUser(req.body);
                    res.status(201).json({ status: "success", user: newUser, token: await JWTAuthendication.generateAccessToken(newUser) });
                } else {
                    res.status(200).json({ status: "success", user: existingUser[0], token: await JWTAuthendication.generateAccessToken(existingUser[0]) });
                }
            } else {
                res.status(401).json({ status: "invalid token" });
            }
        } else {
            res.status(401).json({ status: "invalid phone number" });
        }
    } catch (e) {
        console.log(e, "error");
        res.status(500).json({ error: e });
    }
});


loginRouter.post("/register", async (req, res) => {
    try {
        const userCred = req.body;
        const existingUser = await JWTAuthendication.findUser(userCred.phNo);

        if (existingUser && existingUser.length) {
            const updatedCred = { ...userCred, updatedAt: Date.now() };
            const updateStatus = await JWTAuthendication.updateUser(updatedCred);
            if (Array.isArray(updateStatus) && updateStatus[0]) {
                res.status(200).json({ status: 'updated successfully' });
            } else {
                res.status(400).json({ status: 'update failed' });
            }
        } else {
            res.status(404).json({ status: "user not found" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

loginRouter.post("/login", async (req, res) => {
    const { email, password } = req.body;

    const user = JWTAuthendication.findUser(email);
    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    } else {
        const issueTokenStatus = await JWTAuthendication.autendicate(req.body);

        console.log(issueTokenStatus, "issueTokenStatus");
        if (issueTokenStatus?.status == 200) {
            let { accessToken, refreshToken } = issueTokenStatus;
            res.status(200).json({ accessToken, refreshToken });
            return;
        }
        res.status(404).json({ error: "Invalid password" });
    }
});

loginRouter.post("/token", async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.sendStatus(401);
    }
    const refreshTokens = await redisCon.lrange('refreshTokens', 0, -1);
    if (!refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }
    let GenerateAccessCode = await JWTAuthendication.genarateAccessToken(
        token
    );
    if (GenerateAccessCode?.status == 403) {
        return res.sendStatus(403);
    } else {
        res.status(200).json(GenerateAccessCode);
    }
});

export default loginRouter;