import userModel from "../models/userModel.js";
import bcrypt from 'bcrypt';

export const userLogin = async(req, res)=>{

    const { email, password } = req.body;
    console.log(req.body)
    try {
        const user = await userModel.findOne({email})
        if(!user){
            return res.status(404).json({ message:'User not found. Please sign up to create an account.' })
        }

        const isValidPass = await bcrypt.compare(password,user.password);
        if(!isValidPass){
            return res.status(401).json({ message:'Invalid credentials' });
        }
    
        return res.status(200).json({ message:`Login successful`, user:{ id:user._id,email:user.email,name:user.firstName } })

    } catch (error) {
        res.status(500).json({ message:'Error while logging in user. Please try again later'})
    }
}