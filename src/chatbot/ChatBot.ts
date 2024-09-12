import OpenAI from "openai";
import StoreAdapter from "./StoreAdapter.ts";
/**
 * ChatBot(): ChatBot
 * @params API_KEY - to authenticate with server
 * @params BASE_URL - base url of server 
 * 
 */
export default class ChatBot {

    private numAttemps: number = 0;
    // messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    private client: OpenAI;
    private tools: OpenAI.ChatCompletionTool[] = [];
    private store: StoreAdapter;

    constructor(API_KEY: string, BASE_URL: string, store: StoreAdapter) {
        this.client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });
        this.store = store;
    }
    addMessage(message: OpenAI.Chat.Completions.ChatCompletionMessageParam) {
        this.store.messages.push(message);
        console.log(this.store.messages.length, this.store.messages);

        // TODO: this.clearMessages(5); clearGroup of 5 messages
        if (this.store.messages.length > 5)
            this.clearMessages(this.store.messages.length - 5);
        this.store.save()
    }
    addTools(tool: OpenAI.ChatCompletionTool) {
        this.tools.push(tool);
    }
    clearMessages(count?: number) {
        //removes the previous messages from the queue
        this.store.messages.splice(0, count || this.store.messages.length)
    }
    save() {
        if (this.store)
            this.store.save()
    }
    // setStoreAdapter(store: StoreAdapter) {
    //     this.store = store;
    // }
    async getReply(): Promise<{ status: number, message: string }> {
        //return message status|error

        try {
            const systemMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = { role: "system", content: "You are a REXA chatbot. You answers all the student questions related to courses, jobs and FAQ. in normal condition your answers should be in brief (not more than 100 words) but if you have assured answers from tool call then give detail answers and optionally include recommendation in json format" }
            const response = await this.client.chat.completions.create({ model: "llama3-8b-8192", temperature: 0.5, messages: [systemMsg, ...this.store.messages], tools: this.tools });
            console.log("attempt" + this.numAttemps, response);
            const msg = response.choices[0].message;
            console.log("msgattempt" + this.numAttemps, msg);
            this.addMessage(msg)
            this.save()
            return { status: 200, message: msg.content || "Couldn't get the response at this moment" }
        } catch {
            this.numAttemps++
            console.log("attemptcatch" + this.numAttemps);
            if (this.numAttemps < 3)
                return this.getReply()
            return { status: 501, message: "Couldn't get the response at this moment" }
        }
    }

}