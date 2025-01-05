import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// config
import {config} from 'dotenv';
import morgan from 'morgan';
import userRoutes from './routes/user.routes.js'
import courseRoutes from './routes/course.routes.js'
import errorMiddleware from './middelware/error.middleware.js';
import miscRoute from './routes/missellaneous.routes.js'
import paymentRoutes from './routes/payment.routs.js'
config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use(cors({
    origin:[process.env.FRONTEND_URL],
    credentials:true
}));
app.use(cookieParser());
app.use(morgan('dev'))

// server status check
app.use('/ping' , function(req , res){
    res.send("pong");
});

// Routs for 3 modules


app.use('/api/v1/user' , userRoutes)
app.use('/api/v1/courses' , courseRoutes)
app.use('/api/v1/' , miscRoute)
app.use('/api/v1/payment' , paymentRoutes)


app.all('*' , (req , res)=>{
    res.status(404).send('OOPS !! 404 page not found');
});
// A generic Error Handling

app.use(errorMiddleware);
// Export
export default app;
