import express, { response } from "express";
import pkg from "jsonwebtoken";
import slotsController from "../api/slots.controller.js";
import rateLimit from "express-rate-limit";

const { sign, verify } = pkg;

const router = express.Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300, // Limit each IP to 100 requests per `window` (here, per 15 minutes).-
  message: "Too many requests, please try again later",
});

router.post("/spin", limiter, slotsController.getSpin);

export default router;
