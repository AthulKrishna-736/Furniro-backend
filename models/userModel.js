import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true
    },
    lastName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:false
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },
    isGoogleUser:{
        type:Boolean,
        default:false,
    },
    isBlocked:{
        type:Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user",
    },
    tokenVersion: {
        type: Number,
        default: 0,
    }
}, { timestamps:true })

const userModel = mongoose.model('User',userSchema)
export default userModel;



