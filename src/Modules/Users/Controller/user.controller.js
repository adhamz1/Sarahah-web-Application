import { Router } from "express";
import * as userServices from "../Services/user.service.js"
import { authenticationMiddleware , authorizationMiddleware } from "../../../Middlewares/index.js";
import { hostUpload , resizeImageMiddleware } from "../../../Middlewares/index.js";
import { RolesEnum } from "../../../Common/enums/index.js";
const userRouter = Router();




userRouter.put('/update' , authenticationMiddleware , userServices.UpdateAccountService);
userRouter.delete('/delete' , authenticationMiddleware , userServices.DeleteAccountService);
userRouter.patch('/upload-profile' , authenticationMiddleware , hostUpload({}).single('profile') , resizeImageMiddleware , userServices.UploadProfileService)


userRouter.get('/list' ,authenticationMiddleware , authorizationMiddleware([RolesEnum.SUPER_ADMIN , RolesEnum.ADMIN]) , userServices.ListUsersService);





export {userRouter};