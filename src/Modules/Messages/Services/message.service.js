
import { Messages , User } from "../../../DB/Models/index.js"
import mongoose from "mongoose"

export const sendMessageService = async(req,res)=>{
    const {content} = req.body
    const { receiverId } = req.params

    // Validate receiverId to avoid CastError when clients send ':receiverId' literally
    if (!mongoose.Types.ObjectId.isValid(String(receiverId).trim())) {
        return res.status(400).json({ message: "Invalid receiverId" })
    }

    const receiver = await User.findById(receiverId)
    if(!receiver){
        return res.status(400).json({message:"Receiver not found"})
    }

    const message = await Messages.create({content , receiverId})
    res.status(201).json({message:"Message sent successfully" , message})
}



export const listMessages = async(req,res)=>{    
    const messages = await Messages.find().populate(
        [
            {
            path:'receiverId',
            select:'firstName lastName'
            }
    ])

    res.status(200).json({message:"Messages fetched successfully" , messages})
}

// Toggle message public status (receiver only)
export const togglePublicMessage = async (req, res) => {
    const { messageId } = req.params
    const { isPublic } = req.body
    if (!mongoose.Types.ObjectId.isValid(String(messageId).trim())) {
        return res.status(400).json({ message: "Invalid messageId" })
    }
    const { user: { _id } } = req.loggedInUser
    const msg = await Messages.findById(messageId)
    if (!msg) return res.status(404).json({ message: "Message not found" })
    if (String(msg.receiverId) !== String(_id)) {
        return res.status(403).json({ message: "Not allowed to modify this message" })
    }
    msg.isPublic = Boolean(isPublic)
    await msg.save()
    return res.status(200).json({ message: "Message visibility updated", result: msg })
}

// List all public messages
export const listPublicMessages = async (req, res) => {
    const { skip = 0, limit = 20 } = req.query
    const messages = await Messages.find({ isPublic: true })
        .sort({ createdAt: -1 })
        .skip(parseInt(skip)).limit(parseInt(limit))
        .populate([{ path: 'receiverId', select: 'firstName lastName' }])
    return res.status(200).json({ message: "Public messages fetched successfully", messages })
}

// List messages for logged-in user (their inbox)
export const listMyMessages = async (req, res) => {
    const { user: { _id } } = req.loggedInUser
    const { skip = 0, limit = 20 } = req.query
    const messages = await Messages.find({ receiverId: _id })
        .sort({ createdAt: -1 })
        .skip(parseInt(skip)).limit(parseInt(limit))
    return res.status(200).json({ message: "Your messages fetched successfully", messages })
}