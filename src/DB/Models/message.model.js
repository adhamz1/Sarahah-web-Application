    import mongoose from "mongoose";


    const messageSchema = new mongoose.Schema({
        content:{
            type:String,
            required:true
        },
        receiverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Users',
        required:true
        },
        isPublic:{
            type:Boolean,
            default:false
        }
    },{
        timestamps:true
    })


    export const Messages = mongoose.model('Messages',messageSchema)

