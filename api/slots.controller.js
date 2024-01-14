import slotsDAO from "../DAO/slotsDAO.js";
import handleBet from "../utils/handleBet.js";

export default class slotsController {
  static async getSpin(req, res, next) {
    try {
      const bet = req.body.bet;
      const userJades = req.user.jades;
      const isBetValid = handleBet(bet, userJades);

      if (!isBetValid) throw Error("Bad request");

      const payload = await slotsDAO.spin(req.user._id, bet);
      res.status(200).json({ data: payload });
    } catch (error) {
      let code;
      switch (error.message) {
        case "Bad request":
          code = 400;
          break;
        case "No user found":
          code = 404;
          break;
        case "Cannot create a new round, round is already active":
          code = 409;
          break;
        default:
          code = 500;
          break;
      }
      console.log(error.message);
      res.status(code).json({ error: error.message });
    }
  }
}
