import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { generateAccessToken, tokenExpireTime } from './tokenCreate.js';

dotenv.config();

export const tokenVerify = async (req, res, next) => {
    const accesstoken = req.cookies.accessToken;
    const refreshtoken = req.cookies.refreshToken;
    // console.log('accesToken', accesstoken);
    // console.log('refreshToken', refreshtoken);

    if (!accesstoken) {
        return res.status(401).json({ message: 'Access token not provided' });
    }
    try {
        const decoded = jwt.verify(accesstoken, process.env.JWT_SECRET);
        console.log('Access token decoded:', decoded);

        const user = await userModel.findById(decoded.userId);
        if (!user || user.tokenVersion !== decoded.version) {
            return res.status(403).json({ message: 'Invalid or revoked access token' });
        }

        req.user = {
            id: user._id,
            role: user.role,
        };

        return next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            console.log('Access token expired');

            if (!refreshtoken) {
                return res.status(401).json({ message: 'Both tokens expired. Please log in again.' });
            }

            try {
                const decodedRefresh = jwt.verify(refreshtoken, process.env.JWT_REFRESH_SECRET);
                const user = await userModel.findById(decodedRefresh.userId);
                if (!user || user.tokenVersion !== decodedRefresh.version) {
                    return res.status(403).json({ message: 'Invalid or revoked refresh token' })
                }

                const newAccessToken = generateAccessToken(user);
                const isSecureCookie = process.env.COOKIE === 'true';

                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: isSecureCookie,
                    sameSite: 'strict',
                    maxAge: tokenExpireTime.accessToken * 1000,
                })

                req.user = {
                    id: user._id,
                    role: user.role,
                }

                console.log('accesstoken refreshed successfully');
            } catch (refreshError) {
                console.error('Refresh token verification failed:', refreshError);
                return res.status(403).json({ message: 'Invalid or expired refresh token. Please log in again.' });
            }

        } else {
            console.error('Access token verification failed:', error);
            return res.status(403).json({ message: 'Access token is invalid' });
        }
    }
}