import ajv from "../instances/JSONValidator";

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