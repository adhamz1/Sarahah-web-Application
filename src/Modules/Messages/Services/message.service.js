
import { Messages , User } from "../../../DB/Models/index.js"

export const sendMessageService = async(req,res)=>{
    const {content} = req.body
    const { receiverId } = req.params

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