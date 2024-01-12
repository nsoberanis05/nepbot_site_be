let Coinflip;
import usersDAO from "./usersDAO.js";

/**
 * @todo
 * - [  ] Modify functions to improve clarity and readability, attach comments if necessary
 * - [  ] Modify functions so they throw errors to improve API responses
 * - [ x ] Attach comments on deprecated functions
 *
 * Functions for this class will throw errors, please wrap them in trycatch blocks
 */
export default class coinflipDAO {
  static async injectDB(conn) {
    if (Coinflip) {
      return;
    }
    try {
      Coinflip = await conn.db("JadeHive").collection("Coinflip");
      return;
    } catch (error) {
      console.error(
        `unable to establish a collection handle in coinflipDAO: ${error}`
      );
    }
  }

  static async userLose() {
    return "You lost";
  }

  static async userWin(userId, bet) {
    const winPayout = bet * 2;
    usersDAO.findUserByIdAndUpdateJades(userId, winPayout);
    return "You won";
  }

  static async flipCoin(userId, bet, userCoinSideChoice = "heads") {
    // Process bet
    await usersDAO.findUserByIdAndUpdateJades(userId, bet * -1);

    // Handle odds and dealy
    const chance = Math.floor((Math.random() * 100) + 1); // prettier-ignore
    let message;
    let result;
    // Heads
    if (chance >= 1 && chance <= 50) {
      if (userCoinSideChoice === "heads") {
        message = await this.userWin(userId, bet);
      } else {
        message = await this.userLose();
      }
      result = "heads";
    }
    // Tails
    else {
      if (userCoinSideChoice === "tails") {
        message = await this.userWin(userId, bet);
      } else {
        message = await this.userLose();
      }
      result = "tails";
    }

    return { message, bet, result };
  }
}
