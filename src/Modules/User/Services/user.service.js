

import fs from "node:fs"
import { Messages , User } from "../../../DB/Models/index.js"
import { DeleteFileByPublicId, UploadFileToCloudinary , DeleteFolder as DeleteFolderService, BuildImageUrl} from "../../../Common/Services/cloudinary.service.js"
import { compareSync, hashSync } from "bcrypt"





// Update user
export const Update= async(req,res)=>{
    try {
        const {age , gender, firstName , lastName} = req.body

        const { user: { _id } } = req.loggedInUser
        const updateObject = {firstName , lastName , age , gender}
        const result = await User.findByIdAndUpdate(_id,updateObject , {new:true})
        res.status(200).json({message:"User updated successfully" , result})
    } catch (error) {
        console.log(error);
        res.status(500).json({message:error.message})
    }
}

// Update password (authenticated)
export const UpdatePassword = async (req, res) => {
    const { user: { _id } } = req.loggedInUser
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "currentPassword and newPassword are required" })
    }
    const user = await User.findById(_id)
    if (!user) return res.status(404).json({ message: "User not found" })
    const ok = compareSync(currentPassword, user.password)
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" })
    user.password = hashSync(newPassword, parseInt(process.env.SALT_ROUNDS))
    await user.save()
    return res.status(200).json({ message: "Password updated successfully" })
}
// Delete user
export const Delete = async (req,res)=>{
    const { user:{ _id } } = req.loggedInUser // _id

    const user = await User.findByIdAndDelete(_id)
    if(!user) return res.status(404).json({message:"User not found"})
    // delete user messages
    await Messages.deleteMany({receiverId:_id})
    // check if user has a profile picture
    if(user.profilePicture?.public_id){
        await DeleteFileByPublicId(user.profilePicture.public_id)
    }
    res.status(200).json({message:"User deleted successfully" })

}

// List users 
export const ListUsers  = async(req,res)=>{    
    let users = await User.find().populate("Messages" , "content -receiverId")    
    res.status(200).json({message:"Users fetched successfully" , users})
}
// Upload profile picture
export const UploadProfile = async(req,res)=>{
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

// Get profile picture with selectable size
export const GetProfilePicture = async (req, res) => {
    const { user: { _id } } = req.loggedInUser
    const user = await User.findById(_id)
    if (!user || !user.profilePicture?.public_id) {
        return res.status(404).json({ message: "Profile picture not found" })
    }
    const size = String(req.query.size || 'original').toLowerCase()
    let transformation
    if (size === 'small') transformation = { width: 100, height: 100, crop: 'fill' }
    else if (size === 'medium') transformation = { width: 300, height: 300, crop: 'fill' }
    else if (size === 'large') transformation = { width: 800, height: 800, crop: 'fill' }

    const url = BuildImageUrl(user.profilePicture.public_id, transformation ? { transformation: [transformation] } : {})
    return res.status(200).json({ message: "Profile picture URL", url })
}