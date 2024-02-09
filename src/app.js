import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: '16kb'}));
app.use(express.urlencoded({extended: true, limit: '16kb'}));
app.use(express.static("public"));
app.use(cookieParser());

// Import routes
import userRoute from '../src/routes/user.routes.js'

// User Routes declaration
app.use('/api/v1/users', userRoute);


export { app }