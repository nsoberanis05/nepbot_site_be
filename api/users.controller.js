import usersDAO from "../DAO/usersDAO.js";
import pkg from "jsonwebtoken";
const { sign, verify } = pkg;
export default class usersController {
  static async createToken(_id) {
    return await sign({ sub: _id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
  }

  static async signupUser(req, res, next) {
    const { username, email, password } = req.body;
    try {
      const user = await usersDAO.createUser({ username, password, email });
      const token = await usersController.createToken(user._id);
      res.status(200).cookie("token", token).end();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * @param {*} req
   * @param {*} res
   * @param {*} next
   * @return {string || object || null} - `No User Exists` ||
   *                            `Unable to login user` ||
   *                            user || null
   */
  static async loginUser(req, res, next) {
    const { email, password } = req.body;
    try {
      const user = await usersDAO.loginUser({ password, E });
      const token = await usersController.createToken(user._id);
      res.status(200).cookie("token", token).end();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async getLeaderboard(req, res, next) {
    if (!req.user) return res.status(401).send({ error: "Unauthorized" });

    const data = await usersDAO.findTopUsersByJades();

    if (!data) return res.status(404).json({ error: "No users found" });
    res.status(200).json({ data });
  }

  static async getUser(req, res, next) {
    try {
      if (!req.user) return res.status(401).send({ error: "Unauthorized" });

      const data = await usersDAO.findUserById(req.params.id);

      const { username, level, avatar, discordId } = data;

      res.status(200).send({ username, level, avatar, discordId });
    } catch (error) {
      return res.status(404).send({ error: error.message });
    }
  }

  static async deleteUser(req, res, next) {
    res.json({ mssg: "DELETE User" });
  }

  static async updateUserJades(req, res, next) {
    try {
      if (!req.user || !req.user.admin)
        return res.status(401).send({ error: "Unauthorized" });
      const data = await usersDAO.findUserByIdAndUpdateJades(
        req.user._id,
        req.body.jadesToAdd
      );

      res.status(200).json({ jades: data });
    } catch (error) {
      res.status(404).send({ error: error.message });
    }
  }
}
