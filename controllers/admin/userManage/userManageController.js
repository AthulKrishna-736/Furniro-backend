import userModel from "../../../models/userModel.js";

//get users
export const getUsers = async(req, res)=>{
    try {
        const users = await userModel.find();
        res.status(200).json({ message:'All users have been sent', users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error. Please try again later' });
    }
}

//block users
export const blockUser = async (req, res) => {
    const { id } = req.params;
    console.log('id on parmas: ',id)
    try {
        const user = await userModel.findById(id);

        if(!user){
            return res.status(404).json({ message:'User not found' });
        }

        user.isBlocked = !user.isBlocked;
        const response = await user.save();
        console.log('res after blocking = ', response.isBlocked)

        return res.status(200).json({ message:`User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully` })

    } catch (error) {
        console.log('error toggling user block status', error)  
        return res.status(500).json({ message:'Internal server error' }) 
    }
}