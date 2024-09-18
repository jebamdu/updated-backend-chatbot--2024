import OpenAI from "openai";
import StoreAdapter from "./StoreAdapter.js";
/**
 * ChatBot(): ChatBot
 * @params API_KEY - to authenticate with server
 * @params BASE_URL - base url of server 
 * 
 */

type additionalMessageType = { courses?: string[], jobs?: string[], links?: string[] };
export default class ChatBot {

    private numAttemps: number = 0;
    // messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    private client: OpenAI;
    private tools: OpenAI.ChatCompletionTool[] = [];
    private store: StoreAdapter;
    private additionalMessage: additionalMessageType | undefined = undefined;
    private defaultErrorMsg: string = "I am preparing to answer your question. In the meantime you can explore our courses and jobs section and you can ask some other questions as well"

    constructor(API_KEY: string, BASE_URL: string, store: StoreAdapter) {
        this.client = new OpenAI({ apiKey: API_KEY, baseURL: BASE_URL });
        this.store = store;
    }
    async addMessage(message: OpenAI.Chat.Completions.ChatCompletionMessageParam) {
        this.store.messages.push(message);
        console.log(this.store.messages.length, this.store.messages);

        // TODO: this.clearMessages(5); clearGroup of 5 messages
        if (this.store.messages.length > 1)
            this.clearMessages(this.store.messages.length - 1);
        await this.save()
    }
    addTools(tool: OpenAI.ChatCompletionTool) {
        this.tools.push(tool);
    }
    clearMessages(count?: number) {
        //removes the previous messages from the queue
        this.store.messages.splice(0, count || this.store.messages.length)
    }
    async save() {
        if (this.store)
            await this.store.save()
    }
    // setStoreAdapter(store: StoreAdapter) {
    //     this.store = store;
    // }

    async getReply(): Promise<{ status: number, message: string, additionalMessage?: additionalMessageType }> {
        //return message status|error

        try {
            const systemMsg: OpenAI.Chat.Completions.ChatCompletionMessageParam = { role: "system", content: "You are a REXA chatbot. You answer all the student questions related to courses and jobs and common questions on personal health, water, sanitation, hygiene, and managing disasters. in normal condition your answers should be in brief (not more than 100 words) but if you have assured answers then give it in detail. use the phrase 'As per my knowledge' while getting response from tool call" }
            // console.log("TOOLS", this.tools);
            const response = await this.client.chat.completions.create({ model: "llama3-8b-8192", temperature: 0.5, messages: [systemMsg, ...this.store.messages], tools: this.tools });
            console.log("attempt" + this.numAttemps, response);
            const msg = response.choices[0].message;
            console.log("msgattempt" + this.numAttemps, msg);
            await this.addMessage(msg)
            await this.save()


            if (msg.tool_calls) {
                this.additionalMessage = { courses: [], jobs: [], links: [] };
                const promiseList: Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam>[] = [];
                msg.tool_calls.forEach((toolCall) => {
                    const toolFunctionList = getToolListObj();
                    promiseList.push(new Promise((resolve, reject) => {
                        const tool = toolFunctionList[toolCall.function.name];
                        //TODO: mapArgument if the function require

                        resolve({ tool_call_id: toolCall.id, role: "tool", content: JSON.stringify(tool()) })

                    }))
                })
                const toolresult: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = await Promise.all(promiseList)

                for (const toolRes of toolresult) {
                    // TODO: assign function result into correct params
                    this.additionalMessage.courses?.push(JSON.stringify(toolRes));
                    await this.addMessage(toolRes);
                }

                if (this.numAttemps < 4) {
                    this.numAttemps++;
                    console.log("recursive getResult ", this.numAttemps);
                    return this.getReply();
                }
            }
            return { status: 200, message: msg.content || this.defaultErrorMsg, additionalMessage: this.additionalMessage }
        } catch (e) {
            this.numAttemps++
            console.log("attemptcatch" + this.numAttemps);
            console.log("Error", e);
            if (this.numAttemps < 3)
                return this.getReply()
            return { status: 501, message: this.defaultErrorMsg }
        }
    }

}


function getToolListObj(): { [key: string]: Function } {
    return { "getAllCourse": getAllCourse, "getCourseByCategory": getCourseByCategory }
}

const dummyJSON = [
    {
        "title": "Introduction to JSON",
        "category": "Programming",
        "hours": 4,
        "description": "Learn the basics of JSON, its syntax, and how to use it in web applications.",
        "url": "https://www.tutorialspoint.com/json/json_quick_guide.htm"
    },
    {
        "title": "JSON Schema Basics",
        "category": "Data Management",
        "hours": 3,
        "description": "Understand how to create and validate JSON data using JSON Schema.",
        "url": "https://www.mongodb.com/resources/languages/json-schema-examples"
    },
    {
        "title": "Advanced JSON Techniques",
        "category": "Programming",
        "hours": 5,
        "description": "Explore advanced features of JSON including serialization and deserialization.",
        "url": "https://stackoverflow.blog/2022/06/02/a-beginners-guide-to-json-the-data-format-for-the-internet"
    },
    {
        "title": "Using JSON with APIs",
        "category": "Web Development",
        "hours": 4,
        "description": "Learn how to effectively use JSON in API requests and responses.",
        "url": "https://stackoverflow.blog/2022/06/02/a-beginners-guide-to-json-the-data-format-for-the-internet"
    },
    {
        "title": "JSON for Data Interchange",
        "category": "Data Management",
        "hours": 2,
        "description": "A guide to using JSON for data interchange between systems.",
        "url": "https://jsonformatter.org/0d612e"
    }
]

function getAllCourse() {
    return dummyJSON;
}
function getCourseByCategory(category?: string) {
    return dummyJSON;
}