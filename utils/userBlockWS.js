import userModel from "../models/userModel.js";


const checkUserBlockStatus = async (email) => {
    const user = await userModel.findOne({ email });

    if (!user) {
        return { isBlocked: true, message: 'User not found' };
    }

    if (user.isBlocked) {
        return { isBlocked: true, message: 'User is blocked. Please contact support.' };
    }

    return { isBlocked: false, message: 'User is active' };
};

export default checkUserBlockStatus;
