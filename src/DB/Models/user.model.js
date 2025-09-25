import mongoose from "mongoose";
import { GenderEnum, ProviderEnum, RolesEnum } from "../../Common/enums/user.enum.js";

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        // required:true,
        // lowercase:true,
        trim:true,
        minLength:3,
        maxLength:50
    },
    lastName:{
        type:String,
        // required:true,
        lowercase:true
    },
    email:{
        type:String,
        // unique:true,
        // index:true,
        index:{
            unique:true,
            name:'idx_email_unique'
        },// path level
        required:true
    },
    password:{
        type:String,
        required:true,
    },
    gender:{
        type:String,
        enum:Object.values(GenderEnum),
        default:GenderEnum.OTHER
    },
    age:{
        type:Number,
        // min:[18, 'Age must be at least 18'],
        // max:[120, 'Age must be at most 120'],
        index:{
        name:'idx_age'
        }
    },
    phoneNumber:{
        type:String
    },
    otps:{
        confirm:String,
        resetPassword:String
    },
    isConfirmed:{
        type:Boolean,
        default:false
    },
    role:{
        type:String,
        enum:Object.values(RolesEnum),
        default:RolesEnum.USER
    },
    provider:{
        type:String,
        enum:Object.values(ProviderEnum),
        default:ProviderEnum.LOCAL
    },
    googleSub:String,
    profilePicture:{
        secure_url:String,
        public_id:String
    }
},{
    timestapmps:true,
    virtuals:{
        fullName:{
            get(){
                return `${this.firstName} ${this.lastName}`
            }
        }
    },
    toJSON:{ virtuals:true},
    toObject:{ virtuals:true},
    methods:{
        getDoubleAge(){
            return this.age * 2
        }
    }
})


userSchema.index({firstName:1, lastName:1},{name:'idx_full_name' , unique:true})

userSchema.virtual("Messages",{
    ref:'Messages',
    localField:'_id',
    foreignField:'receiverId'
})


export const User  = mongoose.model('Users', userSchema)

