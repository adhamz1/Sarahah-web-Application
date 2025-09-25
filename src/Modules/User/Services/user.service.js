

import fs from "node:fs"
import { Messages , User } from "../../../DB/Models/index.js"
import { DeleteFileByPublicId, UploadFileToCloudinary , DeleteFolder as DeleteFolderService} from "../../../Common/Services/cloudinary.service.js"





// Update user
export const UpdateService = async(req,res)=>{
    try {
        const {age , gender, firstName , lastName} = req.body

        const {_id} = req.loggedInUser
        const result = await User.findByIdAndUpdate(_id,{age,gender,firstName,lastName} , {new:true})
        res.status(200).json({message:"User updated successfully" , result})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:error.message})
    }
}
// Delete user
export const DeleteService = async (req,res)=>{
    const { user:{ _id } } = req.loggedInUser // _id

    const user = await User.findByIdAndDelete(_id)
    // delete user messages
    await Messages.deleteMany({receiverId:_id})
    // check if user has a profile picture
    if(user.profilePicture){
        fs.unlinkSync(user.profilePicture)
    }
    await DeleteFileByPublicId(user.profilePicture.public_id)
    res.status(200).json({message:"User deleted successfully" })

}

// List users 
export const ListUsersService = async(req,res)=>{    
    let users = await User.find().populate("Messages" , "content -receiverId")    
    res.status(200).json({message:"Users fetched successfully" , users})
}
// Upload profile picture
export const UploadProfileService = async(req,res)=>{
    const {user:{_id}} = req.loggedInUser
    // upload to cloudinary
    const {secure_url , public_id} = await UploadFileToCloudinary(req.file, {
        folder: 'Sarahah-final/User/Profiles'
    })
    const user  = await User.findByIdAndUpdate(_id,{profilePicture: {secure_url,public_id}} , {new:true})
    res.status(200).json({message:"Profile uploaded successfully" , user} )
}

// Delete folder
export const DeleteFolder = async (req,res)=>{
    const {folder} = req.body
    const result = await DeleteFolderService(folder)
    res.status(200).json({message:"Folder deleted successfully" , result})
}