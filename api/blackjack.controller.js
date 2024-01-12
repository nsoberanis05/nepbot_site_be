import blackjackDAO from "../DAO/blackjackDAO.js";
import handleBet from "../utils/handleBet.js";

export default class blackjackController {
  static async createMatch(req, res, next) {
    try {
      const bet = req.body.bet;
      const userJades = req.user.jades;
      const isBetValid = handleBet(bet, userJades);
      if (!isBetValid) throw Error("Bad request");

      const payload = await blackjackDAO.startNewRound(req.user._id, bet);
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
      console.log(error);
      res.status(code).json({ error: error.message });
    }
  }

  static async updateMatch(req, res, next) {
    try {
      const action = req?.route?.path;
      let payload;
      switch (action) {
        case "/hit":
          payload = await blackjackDAO.hit(req.user._id, req.user?.blackjack);
          break;
        case "/stand":
          payload = await blackjackDAO.stand(req.user._id, req.user?.blackjack);
          break;
        default:
          throw Error("Bad request");
      }
      res.status(200).json({ data: payload });
    } catch (error) {
      let code;
      switch (error.message) {
        case "Bad request":
          code = 400;
          break;

        default:
          code = 500;
          break;
      }

      res.status(code).json({ error: error.message });
    }
  }

  static async getMatch(req, res, next) {
    try {
      let payload = await blackjackDAO.getSessionInfo(req.user._id);
      res.status(200).json({ data: payload });
    } catch (error) {
      let code;
      switch (error.message) {
        case "Bad request":
          code = 400;
          break;
        case "Unauthorized":
          code = 401;
          break;
        default:
          code = 500;
          break;
      }
      console.log(error.message);
      res.status(code).json({ error: error.message });
    }
  }

  static async endMatch(req, res, next) {
    try {
      let payload = await blackjackDAO.endSession(req.user._id);
      res.status(200).json({ data: payload });
    } catch (error) {
      let code;
      switch (error.message) {
        case "Bad request":
          code = 400;
          break;
        case "Unauthorized":
          code = 401;
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
