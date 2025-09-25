import Joi from "joi";
import { isValidObjectId } from "mongoose";

function objectIdValidation (value , helper) {
    return isValidObjectId(value) ? value : helper.message('Invalid object id') 
};

export const generalRules = {
    _id:Joi.string().custom(objectIdValidation),
    email: Joi.string().email({
        tlds:{
            allow:['com'],
        }
    }),
    password: Joi
            .string()
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*])[A-Za-z\d@$!%*]{8,}$/)
            .messages({
                'string.pattern.base':'Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character',
            })
};
