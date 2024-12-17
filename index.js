import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRoute from './routes/userRoute.js'
import adminRoute from './routes/adminRoute.js'
import { connectDB } from './utils/mongodb.js'
import errorHandler from './utils/errorHandler.js'

//load env
dotenv.config();

const app = express()
const PORT = process.env.PORT || 5000


//cors setting
const corsOption = {
    origin: process.env.FRONTEND_URL || '',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}

// connect Database
connectDB();

//middlewares for project
app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());

//user route middleware
app.use('/api/user', userRoute);
app.use('/api/admin', adminRoute);

//error handling middleware
app.use(errorHandler);

app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})