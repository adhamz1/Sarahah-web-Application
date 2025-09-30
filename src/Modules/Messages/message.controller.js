import {Router} from "express";
import * as services from './Services/message.service.js'
import { authenticationMiddle } from "../../Middlewares/authentication.middleware.js";
const messageRouter = Router();


messageRouter.post('/send-message/:receiverId',services.sendMessageService)
messageRouter.get('/list',services.listMessages)
messageRouter.get('/public', services.listPublicMessages)
messageRouter.get('/my', authenticationMiddle, services.listMyMessages)
messageRouter.patch('/public/:messageId', authenticationMiddle, services.togglePublicMessage)




export  {messageRouter};