import mongoose from "mongoose";


const categorySchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    }, 
},{ timestamps: true })


const categoryModel = mongoose.model('Category', categorySchema);
export default categoryModel;
