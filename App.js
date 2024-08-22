import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import passport from "passport";
import session from "express-session";
import TrainerRoutes from "./Routes/TrainerRoutes.js";



dotenv.config({
    path: "./config/config.env",
});

const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH','HEAD'],
    credentials: true,
}
    const app = express();
    app.use(express.json());
    app.use(bodyParser.json());
    app.use(cookieParser());
    app.use(cors(corsOptions))

    app.use('/api/auth',TrainerRoutes );

app.get("/", (req, res) => {
    res.send("Server is working");
  });
  
  
  
  
  export default app;