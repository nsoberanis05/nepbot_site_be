import pkg from "jsonwebtoken";
import usersDAO from "../DAO/usersDAO.js";
const { verify } = pkg;

async function authenticate(req, res, next) {
  const token = req.cookies.token;
  try {
    // verify token
    const { sub } = await verify(token, process.env.JWT_SECRET);

    if (!sub) {
      req.user = null;
      return next();
    }

    // search for user based on their discord id
    const userDiscord = await usersDAO.findUserByDiscordId(sub);
    if (!userDiscord) {
      req.user = null;
    } else if (userDiscord) {
      const {
        _id,
        username,
        jades,
        avatarUrl,
        dailyStreak,
        level,
        xp,
        discriminator,
        blackjack,
      } = userDiscord;
      req.user = {
        _id,
        username,
        jades,
        avatarUrl,
        dailyStreak,
        level,
        xp,
        discriminator,
        blackjack,
      };
    }
  } catch (error) {
    console.log(error.message);
    req.user = null;
  }

  await next();
}

export default authenticate;
