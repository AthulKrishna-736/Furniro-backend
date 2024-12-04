import mongoose from "mongoose";


const bannerSchema = mongoose.Schema({
    bannerLocation:{
        type:String,
    },
    image:{
        type:String,
    }
},{ timestamps: true })

const bannerModel = mongoose.model('banner', bannerSchema)

export default bannerModel;