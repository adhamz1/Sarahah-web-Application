import { Router } from "express";
import * as services from './Services/message.service.js'
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
const messageRouter = Router();


messageRouter.post('/send/:receiverId' , services.sendMessage)
messageRouter.get('/get-messages-user' , authenticationMiddleware , services.getMessages)
messageRouter.get("/get-all-message", services.getAllPublicMessage);



export {messageRouter};