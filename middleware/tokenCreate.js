import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import crypto from 'crypto';

dotenv.config();

export const tokenExpireTime = {
    accessToken: 90000, //seconds
    refreshToken: 604800, //seconds
}

export const generateAccessToken = (user) => {
    console.log('accessuser = ', user)
    return jwt.sign({ userId: user._id, role: user.role, version: user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: `${tokenExpireTime.accessToken}s` });
}

export const generateRefreshToken = (user) => {
    console.log('refreshuser = ', user)
    return jwt.sign({ userId: user._id, version: user.tokenVersion }, process.env.JWT_REFRESH_SECRET, { expiresIn: `${tokenExpireTime.refreshToken}s` })
}
  
export const generateCsrfToken = ()=>{
    return crypto.randomBytes(32).toString('hex');
}

export const setCsrfCookie = (res, csrfToken) => {
    const isSecureCookie = process.env.COOKIE === 'true';
    const signedToken = crypto
    .createHmac('sha256', process.env.CSRF_SECRET)
    .update(csrfToken)
    .digest('hex');

    res.cookie('csrfToken', csrfToken, {
        httpOnly: false,
        secure: isSecureCookie,
        sameSite: 'strict',
        maxAge: 3600 * 1000,
    });

    res.cookie('csrfTokenSigned', signedToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'strict',
        maxAge: 3600 * 1000,
    })
}

export const setAuthCookies = (res, accessToken, refreshToken) => {  
    const csrfToken = generateCsrfToken();

    const isSecureCookie = process.env.COOKIE === 'true';
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'strict',
        maxAge: tokenExpireTime.accessToken * 1000,
    })
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isSecureCookie,
        sameSite: 'strict',
        maxAge: tokenExpireTime.refreshToken * 1000,
    })

    setCsrfCookie(res, csrfToken);
}
