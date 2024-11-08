import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cors from 'cors'
import userRoute from './routes/userRoute.js'
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
mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
    console.log("Connected to MongoDB Atlas")
})
.catch((error)=>{
    console.log('Connection failed: ',error)
})

//middlewares for project
app.use(cors(corsOption));
app.use(express.json());

//user route middleware
app.use('/api/user',userRoute)


app.listen(PORT,()=>{
    console.log(`Server is running on http://localhost:${PORT}`);
})