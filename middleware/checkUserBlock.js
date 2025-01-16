import userModel from "../models/userModel.js";

const checkUserBlock = async (req, res, next) => {
    try {
        const email = req.params.emailInt || req.query.email || req.params.email; 
        console.log('req body middleware: ',req.params);
        console.log('req param middleware: ', req.query);
        console.log('req param email: ', req.params.emailInt)
        console.log('check email middle: ', email)

        if (!email) {
            console.log('email is required..!');
            return res.status(400).json({ 
                isBlocked: true, 
                message: 'Email is required to proceed.' 
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            console.log('user not found')
            return res.status(404).json({ 
                isBlocked: true, 
                message: 'User not found.' 
            });
        }

        if (user.isBlocked) {
            console.log('user is blocked');
            return res.status(403).json({ 
                isBlocked: true, 
                message: 'User is blocked.' 
            });
        }
        console.log('user is active')
        next();
    } catch (error) {
        console.error("Error checking user block status:", error);
        res.status(500).json({ 
            isBlocked: true, 
            message: 'Internal server error. Please try again later.' 
        });
    }
};

export default checkUserBlock;
