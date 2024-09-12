import OpenAI from "openai";

export default interface StoreAdapter {
    messages:OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    
    // getMessageLength():number;
    // getMessages():OpenAI.Chat.Completions.ChatCompletionMessageParam[]
    save():Promise<boolean>
}
