import OpenAI from "openai";
import StoreAdapter from "../chatbot/StoreAdapter.js";
import Redis from "ioredis";
// { createClient, Graph, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts }
export default class RedisStoreAdapter implements StoreAdapter {
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    userid: string;
    keyTemplate: string;
    key: string;
    redisCon: Redis;
    constructor(redisCon: Redis, userid: string, keyTemplate: string = "chat.$1") {
        this.userid = userid;
        this.keyTemplate = keyTemplate;
        this.key = this.keyTemplate.replace("$1", this.userid);
        this.redisCon = redisCon;
    }
    async loadMessages() {
        // get previous messages from redis

        this.messages = (await this.redisCon.lrange(this.key, 0, -1)).map(msg => JSON.parse(msg));
        if (this.messages.length === 0) {
            const agentMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = { role: "assistant", content: "Hello I am REXA, You can ask me questions related to course  guidance, jobs, and FAQ on Water, sanitation and hygiene." };
            this.messages.push(agentMsg);
        }
    }
    private async setMessages(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {

    }
    // getMessages(): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    //     return this.messages
    // }

    async save(): Promise<boolean> {
        try {
            await this.redisCon.del(this.key);
            await this.redisCon.rpush(this.key, ...this.messages.map(msg => JSON.stringify(msg)));
            await this.redisCon.expire(this.key, 86400);
            console.log("after saving", this.messages.length, this.messages);
            const localMessages = await this.redisCon.lrange(this.key, 0, -1);
            console.log("after saving from redis", localMessages.length, localMessages);

            return true;
        } catch {
            return false;
        }
    }

    // getMessageLength(): number {
    //     return this.messages.length
    // }
}