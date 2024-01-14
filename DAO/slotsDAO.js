let Slots;
import usersDAO from "./usersDAO.js";

/**
 * @todo
 * - [  ] Modify functions to improve clarity and readability, attach comments if necessary
 * - [  ] Modify functions so they throw errors to improve API responses
 * - [ x ] Attach comments on deprecated functions
 *
 * Functions for this class will throw errors, please wrap them in trycatch blocks
 */
export default class slotsDAO {
  static async injectDB(conn) {
    if (Slots) {
      return;
    }
    try {
      Slots = await conn.db("JadeHive").collection("Slots");
      return;
    } catch (error) {
      console.error(
        `unable to establish a collection handle in slotsDAO: ${error}`
      );
    }
  }

  static async userLose() {
    return "You lost";
  }

  static async userWin(userId, bet, multiplier) {
    const winPayout = bet * multiplier;
    usersDAO.findUserByIdAndUpdateJades(userId, winPayout);
    return "You won";
  }

  static async spin(userId, bet) {
    // Winnin % logic
    const chance = Math.floor((Math.random() * 100) + 1); // prettier-ignore
    // lose
    if (chance >= 1 && chance <= 50) {
      userLost();
    }
    // win back equal amount
    else if (chance >= 51 && chance <= 70) {
      userWon(userId, bet, 1);
    }
    // win 2x amount
    else if (chance >= 71 && chance <= 90) {
      userWon(userId, bet, 2);
    }
    // win 3x amount
    else if (chance >= 91 && chance <= 96) {
      userWon(userId, bet, 3);
    }
    // win 4x amount
    else if (chance >= 97 && chance <= 99) {
      userWon(userId, bet, 4);
    }
    // win 10x amount
    else if (chance === 100) {
      userWon(userId, bet, 10);
    }
    // something went wrong
    else {
      throw Error("Something went wrong");
    }
  }
}
