import {Router} from "express";
import * as services from '../Services/auth.service.js'
import { SignUpSchema } from "../../../validators/user.schema.js";
import { validationMiddleware , authenticationMiddle , refreshTokenVerify } from "../../../Middlewares/index.js";
const authRouter = Router();


authRouter.post('/signup', validationMiddleware(SignUpSchema),services.SignUp)
authRouter.post('/signup-gmail' , services.SignUpWithGmail)
authRouter.post('/login-gmail' , services.LoginWithGmail)
authRouter.post('/login',services.Login)
authRouter.post('/logout', authenticationMiddle , refreshTokenVerify ,services.Logout)
authRouter.put('/confirm-email',services.ConfirmEmail)
authRouter.post('/refresh-token', refreshTokenVerify ,  services.RefreshToken)


export {authRouter} ;