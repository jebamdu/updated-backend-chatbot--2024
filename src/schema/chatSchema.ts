import ajv from "../instances/JSONValidator.js";

const chatSchema = {
    type: "object",
    properties: {
        message: { type: "string" },
    },
    required: ["message"],
    additionalProperties: false
};

const chatValidator=ajv.compile(chatSchema);
export default chatValidator;