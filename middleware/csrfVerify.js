import crypto from 'crypto'

export const verifyCsrfToken = (req, res, next) => {
    const csrfTokenFromHeader = req.headers['x-csrf-token'];
    const csrfTokenFromCookie = req.cookies.csrfToken;
    const csrfTokenSigned = req.cookies.csrfTokenSigned;

    console.log('Header CSRF:', csrfTokenFromHeader);
    console.log('Cookie CSRF:', csrfTokenFromCookie);
    console.log('Signed CSRF:', csrfTokenSigned);

    if (!csrfTokenFromHeader || !csrfTokenFromCookie || !csrfTokenSigned) {
        return next({ statusCode: 403, message: 'CSRF Token Missing' });
    }

    const expectedSignedToken = crypto
        .createHmac('sha256', process.env.CSRF_SECRET)
        .update(csrfTokenFromCookie)
        .digest('hex');

    if (csrfTokenFromHeader !== csrfTokenFromCookie || csrfTokenSigned !== expectedSignedToken) {
        res.clearCookie('accessToken', { httpOnly: true, secure: true, sameSite: 'strict' });
        res.clearCookie('refreshToken', { httpOnly: true, secure: true, sameSite: 'strict' });
        res.clearCookie('csrfToken', { httpOnly: false, secure: true, sameSite: 'strict' });
        res.clearCookie('csrfTokenSigned', { httpOnly: true, secure: true, sameSite: 'strict' });

        return next({ statusCode: 403, message: 'CSRF token validation failed' });
    }

    next();
};
