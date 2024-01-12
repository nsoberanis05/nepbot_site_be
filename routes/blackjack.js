import express, { response } from "express";
import pkg from "jsonwebtoken";
import blackjackController from "../api/blackjack.controller.js";
const { sign, verify } = pkg;

const router = express.Router();

router.get("/match", blackjackController.getMatch);

router.get("/end", blackjackController.endMatch);

router.post("/start", blackjackController.createMatch);

router.patch("/hit", blackjackController.updateMatch);

router.patch("/stand", blackjackController.updateMatch);

export default router;
