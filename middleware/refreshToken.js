import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { generateAccessToken, tokenExpireTime } from './tokenCreate.js';

dotenv.config();

export const refreshTokenCheck = async(req, res)=>{
    const refreshToken = req.cookies.refreshToken;
    console.log('check refreshtoken = ', refreshToken)

    if(!refreshToken){
        console.log('refresh token not found')
        return res.status(403).json({ message:'Refresh token not found' });
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user)=>{
        if(err){
            console.log('invalid refresh token')
            return res.status(403).json({ message:'Invalid refresh token' });
        }

        const newAccessToken = generateAccessToken(user);
        res.cookie('accessToken', newAccessToken,{
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: tokenExpireTime.accessToken * 1000,
        })
        console.log('accesstoken refres')
        return res.status(200).json({ message:'token refreshed successfully', accessToken: newAccessToken })
    })
}
