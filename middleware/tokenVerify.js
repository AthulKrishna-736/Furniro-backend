import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

export const tokenVerify = async(req, res, next)=>{
    const accesstoken = req.cookies.accessToken;
    const refreshtoken = req.cookies.refreshToken;

    console.log('accessToken in middleware = ', accesstoken)
    console.log('refreshToken in middleware = ', refreshtoken)

    if(!accesstoken){
        return res.status(401).json({ message:'Access token not provided' });
    }
    try {
        const decoded = jwt.verify(accesstoken, process.env.JWT_SECRET);
        console.log('access decoded = ',decoded)
        req.user = decoded;
        next();
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Access token expired');

            if (!refreshtoken) {
                return res.status(401).json({ message: 'Refresh token not provided. Please log in again.' });
            }

            return res.status(403).json({ message: 'Access token expired. Use /refreshToken to refresh.' });
        } else {
            console.error('Invalid access token:', error);
            return res.status(403).json({ message: 'Access token is invalid' });
        }
    }
}