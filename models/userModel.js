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
        required:true
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },
    isVerfied:{
        type:Boolean,
        default:false,
    },
    otp:{
        type:String,
    },
    otpExpireAt:{
        type:Date,
    },
    isBlock:{
        type:Boolean,
    },
    createdAt:{
        type:Date,
        default:Date.now(),
    }
})

const userModel = mongoose.model('User',userSchema)
export default userModel;



