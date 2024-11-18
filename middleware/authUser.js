import jwt from 'jsonwebtoken';

export const authenticateToken  = (req, res, next)=>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(403).json({ message:'Access forbidden: You dont have permission to access this resource.' })
    } 
    
    jwt.verify(token, process.env.JWT_SECRET,(err, user)=>{
        if(err){
            return res.status(401).json({ message:'Unauthorized access. Please login' })
        } 
        req.user = user;
        next();
    });
}