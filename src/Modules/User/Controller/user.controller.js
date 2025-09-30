import {Router} from "express";
import * as services from '../Services/user.service.js'
import { authorizationMiddle , HostUpload } from "../../../Middlewares/index.js";
import { authenticationMiddle } from "../../../Middlewares/authentication.middleware.js";
import { SignUpSchema } from "../../../validators/user.schema.js";
import { validationMiddleware } from "../../../Middlewares/validation.middleware.js";
import { RolesEnum } from "../../../Common/enums/user.enum.js";
const userRouter = Router();

userRouter.delete('/delete' , authenticationMiddle,authorizationMiddle([RolesEnum.USER]),  services.Delete)
userRouter.put('/update', authenticationMiddle,services.Update)
userRouter.patch('/update-password', authenticationMiddle, services.UpdatePassword)





// Admins
userRouter.get('/list', 
    authenticationMiddle ,
    authorizationMiddle([RolesEnum.ADMIN , RolesEnum.SUPER_ADMIN]),  
    services.ListUsers)




// Upload Profile
userRouter.patch('/upload-profile',
    authenticationMiddle,
    validationMiddleware(SignUpSchema),
    HostUpload().single('profile'),
    services.UploadProfile
)

// Get profile picture URL with optional size=small|medium|large
userRouter.get('/profile-picture',
    authenticationMiddle,
    services.GetProfilePicture
)


userRouter.delete('/test-delete-cloud', services.DeleteFolder)
export {userRouter};