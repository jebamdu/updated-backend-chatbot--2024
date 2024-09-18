import { Request, Response } from "express";
import ChatBot from "../chatbot/ChatBot.js";
import RedisStoreAdapter from "../adapter/RedisStoreAdapter.js";
import redisCon from "../DBConnections/redisConnection.js";
import languageTranslation from "../languageTranslation.service.js";
import LanguageTranslation from "../languageTranslation.service.js";


export async function chatbotController(req: Request, res: Response) {
    /**
     * Goal
     * only returns completed message or error
     * 
     * not going to consider the tool call as a message
    */
    if (!req.user) {
        return res.json({ status: 400, message: "unable to find the user" });
    }
    const { message, language } = req.body;
    const redisAdapter = new RedisStoreAdapter(redisCon, req.user.phno)
    await redisAdapter.loadMessages()
    const chatBot = new ChatBot(process.env.API_KEY || "", process.env.BASE_URL || "", redisAdapter);

    // chatBot.addTools({
    //     "type": "function",
    //     "function": {
    //         "name": "getCourseByCategory",
    //         "description": "it will return a list of courses with description and course details like category,hours,target audience",
    //         "parameters": {
    //             "type": "object",
    //             "properties": {
    //                 "courseCategory": {
    //                     "type": "string",
    //                     "description": "Category or domain of the course which user wants"
    //                 }
    //             },
    //             "required": [
    //                 "courseCategory"
    //             ]
    //         }
    //     }
    // });

    // chatBot.addTools({
    //     "type": "function",
    //     "function": {
    //         "name": "getAllCourse",
    //         "description": "it will return full list of course"
    //     }
    // })


    const translatedMessage = await LanguageTranslation.translateText(message, "en")
    chatBot.addMessage({ content: translatedMessage, role: "user" });
    const reply = await chatBot.getReply();
    reply.message = await LanguageTranslation.translateText(reply.message, language)
    res.json(reply)
    // { status: 200, message: message, additionalMessage: { links: [], courses: [], jobs: [] } }
}

