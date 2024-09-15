import { Router } from "express";
import { chatbotController } from "../controllers/chatbot.controller";
import chatValidator from "../schema/chatSchema";
import validatorMiddleware from "../middleware/validatorMiddleware";
import authNsetUser from "../middleware/authNsetUser";

const chatRouter = Router();

/** POST Methods */
/**
 * @swagger
 * '/chatbot/chat':
 *  post:
 *     tags:
 *     - User Chat  API
 *     summary: Send user message to chatbot
 *     description: This route process the user questions by using AI and returns the output of AI's response text and links|courses|Jobs
 *     requestBody:
 *      required: true
 *      content:
 *        application/json:
 *           schema:
 *            type: object
 *            required:
 *              - message
 *            properties:
 *              message:
 *                type: string
 *                default: Give me some tips in personal hygiene 
 *              
 *     responses:
 *      200:
 *        content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   default: 200
 *                 message:
 *                   type: string
 *                   default: reply from chatbot
 *                 errors:
 *                   type: array
 *                   description: only return if any error occurs 
 *                 additionalMessage:
 *                   type: object
 *                   properties:
 *                     links:
 *                       type: array
 *                       items:
 *                         type: string
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: string
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: string
 *        description: Always gives the 200 success
 */
chatRouter.post('/chat', authNsetUser, validatorMiddleware(chatValidator), chatbotController);

export default chatRouter