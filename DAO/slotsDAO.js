let Slots;
import usersDAO from "./usersDAO.js";
const totalIcons = 5;

/**

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

  static generateRandomNumbers(min, max, count) {
    if (count > max - min + 1) {
      return "Cannot generate unique random numbers. Count exceeds range.";
    }

    const numbers = [];
    while (numbers.length < count) {
      const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
      if (!numbers.includes(randomNum)) {
        numbers.push(randomNum);
      }
    }

    return numbers;
  }

  static async userLose() {
    const randomIndex = generateRandomNumbers(0, totalIcons - 1, 3);
    if (Math.random() > 0.6) {
      randomIndex[1] = randomIndex[0];
    }
    return { message: "You lost", icons: randomIndex };
  }

  static async userWin(userId, bet, multiplier) {
    const winPayout = bet * multiplier;
    usersDAO.findUserByIdAndUpdateJades(userId, winPayout);
    // 0 = turtle 1x
    // 1 = single dollar 4x
    // 2 = pink heart 2x
    // 3 = green heart jackpot
    // 4 = cherry 3x
    let icon;
    switch (multiplier) {
      case 1:
        icon = 0;
        break;
      case 2:
        icon = 2;
        break;
      case 3:
        icon = 4;
        break;
      case 4:
        icon = 1;
        break;
      case 10:
        icon = 3;
        break;
      default:
        break;
    }

    return { message: "You won", icons: [icon, icon, icon] };
  }

  static async spin(userId, bet) {
    // Winnin % logic
    const chance = Math.floor((Math.random() * 100) + 1); // prettier-ignore
    const payload = {};
    let result;
    // lose
    if (chance >= 1 && chance <= 50) {
      result = await this.userLose();
    }
    // win back equal amount
    else if (chance >= 51 && chance <= 70) {
      result = await this.userWin(userId, bet, 1);
    }
    // win 2x amount
    else if (chance >= 71 && chance <= 90) {
      result = await this.userWin(userId, bet, 2);
    }
    // win 3x amount
    else if (chance >= 91 && chance <= 96) {
      result = await this.userWin(userId, bet, 3);
    }
    // win 4x amount
    else if (chance >= 97 && chance <= 99) {
      result = await this.userWin(userId, bet, 4);
    }
    // win 10x amount
    else if (chance === 100) {
      result = await this.userWin(userId, bet, 10);
    }
    // something went wrong
    else {
      payload.result = result;
      return payload;
    }
  }
}
