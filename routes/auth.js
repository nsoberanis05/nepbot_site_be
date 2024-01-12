import express, { response } from "express";
import Axios from "axios";
import usersDAO from "../DAO/usersDAO.js";
import usersController from "../api/users.controller.js";
import pkg from "jsonwebtoken";
const { sign, verify } = pkg;

const router = express.Router();

// deprecated, use discord OAuth
// router.post("/login", usersController.loginUser);

// router.post("/signup", usersController.signupUser);

router.get("/discord/login", async (req, res) => {
  res.redirect(process.env.DISCORD_LOGIN_URL);
});

router.get("/discord/logout", async (req, res) => {
  const token = req.cookies.token;
  try {
    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Encoding": "application/x-www-form-urlencoded",
    };

    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_SECRET,
      token,
    });

    const response = await Axios.post(
      "https://discord.com/api/oauth2/token/revoke",
      params,
      { headers }
    );

    console.log(response);

    req.user = null;
    res.clearCookie("token");
    res.end();
  } catch (error) {
    console.log(error);
  }
});

router.get("/discord/callback", async (req, res) => {
  try {
    if (!req.query.code) return console.log("No Code Provided");
    const { code } = req.query;
    const params = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    });

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept-Encoding": "application/x-www-form-urlencoded",
    };

    console.log("Passed query check :D");

    const response = await Axios.post(
      "https://discord.com/api/oauth2/token",
      params,
      { headers }
    );
    console.log("Passed post call :D", response.data);

    const userResponse = await Axios.get("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${response.data.access_token}`,
        ...headers,
      },
    });

    console.log("Passed user call :D", userResponse.data);
    /* PLEASE NOTE ANY REFERENCE TO ID IN THIS FUNCTION IS IN REGARDS TO DISCORD ID */
    const { id, username, avatar, discriminator } = userResponse.data;

    const USER_EXISTS = await usersDAO.findUserByDiscordId(id);

    if (USER_EXISTS) {
      if (
        USER_EXISTS.avatarUrl !=
        `https://cdn.discordapp.com/avatars/${id}/${avatar}`
      ) {
        await usersDAO.findUserByDiscordIdAndUpdateAvatar(id, avatar);
      }
    } else {
      await usersDAO.createUserFromDiscord({
        discordId: id,
        username,
        avatar,
        discriminator,
      });
    }

    const token = sign({ sub: id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    console.log("Passed token creation :D", token);

    res.cookie("token", token, { sameSite: "none", secure: true });
    res.redirect(process.env.CLIENT_REDIRECT_URL);
  } catch (error) {
    console.log(error.message);
    res.status(400).json({ error: error.message });
  }
});

export default router;
