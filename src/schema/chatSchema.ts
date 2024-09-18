import ajv from "../instances/JSONValidator.js";

const chatSchema = {
    type: "object",
    properties: {
        message: { type: "string" },
        language: { enum: ["en", "ta", "hi"] }
    },
    required: ["message","language"],
    additionalProperties: false
};

const chatValidator = ajv.compile(chatSchema);
export default chatValidator;