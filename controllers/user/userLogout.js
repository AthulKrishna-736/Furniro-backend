export const userLogout = async (req, res) => {
    try {
        res.clearCookie('accessToken',{
            httpOnly: true,
            secure: true,
            sameSite:'strict',
        })
    
        res.clearCookie('refreshToken',{
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        })

        return res.status(200).json({ message: 'Logout successful' });
    
    } catch (error) {
        console.log('error while clearing cookie', error)
        return res.status(500).json({ message: 'Logout failed' });    }
}