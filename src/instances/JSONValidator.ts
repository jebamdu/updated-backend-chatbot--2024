import Ajv from 'ajv';
import apply from "ajv-formats";
const ajv = new Ajv({ allErrors: true });
apply(ajv)

export default ajv;