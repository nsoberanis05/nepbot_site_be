import express from "express";
import usersDAO from "../DAO/usersDAO.js";
import usersController from "../api/users.controller.js";

const router = express.Router();

router.get("/me", async (req, res) => {
  const data = req.user;
  res.json({ data });
});

router.get("/leaderboard", usersController.getLeaderboard);

router.get("/:id", usersController.getUser);

router.delete("/:id", usersController.deleteUser);

router.patch("/jades", usersController.updateUserJades);

router.patch("/:id", async (req, res) => {});

export default router;
