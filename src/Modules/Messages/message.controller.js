import {Router} from "express";
import * as services from './Services/message.service.js'
const messageRouter = Router();


messageRouter.post('/send-message/:receiverId',services.sendMessageService)
messageRouter.get('/list',services.listMessages)




export  {messageRouter};