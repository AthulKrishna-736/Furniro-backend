import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

dotenv.config();

export const tokenExpireTime = {
    accessToken: 900, //seconds
    refreshToken: 604800, //seconds
}

export const generateAccessToken = (user)=>{
    console.log('accessuser = ',user.firstName)
    return jwt.sign({userId: user._id}, process.env.JWT_SECRET, { expiresIn: `${tokenExpireTime.accessToken}s` });
}

export const generateRefreshToken = (user)=>{
    console.log('refreshuser = ',user.firstName)
    return jwt.sign({userId: user._id},  process.env.JWT_REFRESH_SECRET, { expiresIn: `${tokenExpireTime.refreshToken}s` })
}

export const setAuthCookies = (res, accessToken, refreshToken)=>{
    const isSecureCookie = process.env.COOKIE == 'true';
    res.cookie('accessToken', accessToken,{
        httpOnly: true, 
        secure: isSecureCookie, 
        sameSite: 'strict',
        maxAge: tokenExpireTime.accessToken * 1000, 
    })
    res.cookie('refreshToken',refreshToken,{
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'strict',
        maxAge: tokenExpireTime.refreshToken * 1000,
    })
}