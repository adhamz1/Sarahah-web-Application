import Joi from "joi";
import { generalRules } from "./general-rules.utils.js";
import { GenderEnum } from "../Common/enums/user.enum.js";

export const SignUpSchema = {
    body: Joi.object({
        firstName: Joi.string().alphanum().messages({
            'string.base': 'First name must be a string',
            'any.required': 'First name is required',
            'string.alphanum': 'First name must contain only letters and numbers',
        }),
        lastName:Joi.string().min(3).max(20),
        email:generalRules.email.required(),
        password: generalRules.password.required(),
        confirmPassword:Joi.string().valid(Joi.ref('password')) ,
        gender: Joi.string().valid(...Object.values(GenderEnum)).optional(),
        phoneNumber: Joi.string(),
        age: Joi.number().optional(),
    })
    .options({presence:'required'})
    .with('email','password')
}
