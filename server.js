import express from "express";
import userRoutes from "./routes/user.js";
import authRoutes from "./routes/auth.js";
import blackjackRoutes from "./routes/blackjack.js";
import coinflipRoutes from "./routes/coinflip.js";

import mongodb from "mongodb";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import pkg from "jsonwebtoken";
import usersDAO from "./DAO/usersDAO.js";
import { rateLimit } from "express-rate-limit";
import authenticate from "./middleware/authenticate.js";
import authorize from "./middleware/authorize.js";

const limiter = rateLimit({
  windowMs: 30 * 60 * 1000, // 15 minutes
  limit: 1000, // Limit each IP to 100 requests per `window` (here, per 15 minutes).-
  message: "Too many requests, please try again later",
});
const { verify } = pkg;
dotenv.config();

// express app
const app = express();
app.use(
  cors({
    origin: "https://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(limiter);
app.use(authenticate);

app.use((req, res, next) => {
  console.log(req.path, req.method);
  next();
});
app.use("/api/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/blackjack", blackjackRoutes);
app.use("/coinflip", coinflipRoutes);

export default app;
