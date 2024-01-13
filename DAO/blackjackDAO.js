let Blackjack;
import usersDAO from "./usersDAO.js";

const cardsValuesTemplate = [
  [0, 2],
  [1, 2],
  [2, 2],
  [3, 2], // 2 of clubs, diamonds, hearts, spades
  [4, 3],
  [5, 3],
  [6, 3],
  [7, 3], // 3 of clubs, diamonds, hearts, spades
  [8, 4],
  [9, 4],
  [10, 4],
  [11, 4], // 4 of clubs, diamonds, hearts, spades
  [12, 5],
  [13, 5],
  [14, 5],
  [15, 5], // 5 of clubs, diamonds, hearts, spades
  [16, 6],
  [17, 6],
  [18, 6],
  [19, 6], // 6 of clubs, diamonds, hearts, spades
  [20, 7],
  [21, 7],
  [22, 7],
  [23, 7], // 7 of clubs, diamonds, hearts, spades
  [24, 8],
  [25, 8],
  [26, 8],
  [27, 8], // 8 of clubs, diamonds, hearts, spades
  [28, 9],
  [29, 9],
  [30, 9],
  [31, 9], // 9 of clubs, diamonds, hearts, spades
  [32, 10],
  [33, 10],
  [34, 10],
  [35, 10], // 10 of clubs, diamonds, hearts, spades
  [36, 10],
  [37, 10],
  [38, 10],
  [39, 10], // Jack of clubs, diamonds, hearts, spades
  [40, 10],
  [41, 10],
  [42, 10],
  [43, 10], // Queen of clubs, diamonds, hearts, spades
  [44, 10],
  [45, 10],
  [46, 10],
  [47, 10], // King of clubs, diamonds, hearts, spades
  [48, 1],
  [49, 1],
  [50, 1],
  [51, 1], // Ace of clubs, diamonds, hearts, spades
];
const cardsValues = new Map(cardsValuesTemplate);
/**
 * @todo
 * - [  ] Modify functions to improve clarity and readability, attach comments if necessary
 * - [  ] Modify functions so they throw errors to improve API responses
 * - [ x ] Attach comments on deprecated functions
 *
 * Functions for this class will throw errors, please wrap them in trycatch blocks
 */
export default class blackjackDAO {
  static async injectDB(conn) {
    if (Blackjack) {
      return;
    }
    try {
      Blackjack = await conn.db("JadeHive").collection("blackjack");
      return;
    } catch (error) {
      console.error(
        `unable to establish a collection handle in blackjackDAO: ${error}`
      );
    }
  }

  static async updateBlackjackSession(blackjackSessionId, payload) {
    try {
      const session = await Blackjack.findOneAndUpdate(
        { _id: blackjackSessionId },
        { $set: { ...payload } }
      );
      if (!session) throw Error("No session found");
      return;
    } catch (error) {
      console.error(`Unable to find session: ${error}`);
      throw Error("Something went wrong, please try again later");
    }
  }

  static async startNewRound(userId, bet) {
    // Find user
    const user = await usersDAO.findUserById(userId);
    if (!user) throw Error("No user found");

    // Find session
    let session = await Blackjack.findOne({ _id: user?.blackjack });
    let isSessionActive = session?.isActive;

    if (session && isSessionActive)
      throw Error("Cannot create a new round, round is already active");

    let isUserBlackjackSessionValid = session && !isSessionActive;
    let payload;

    if (isUserBlackjackSessionValid) {
      // Deal cards
      payload = await this.dealCards(session);

      // Handle case where user first hand is blackjack
      const { userTotal } = payload;
      if (userTotal === 21) {
        payload.message = "You won";
        payload.isActive = "false";
        await this.userWin(userId, bet);
      }

      // Update blackjack session in the db
      await this.updateBlackjackSession(user.blackjack, { ...payload, bet });
    } else {
      // Create new deck and deal cards
      payload = await this.dealCards();

      // Handle case where user first hand is blackjack
      const { userTotal } = payload;
      if (userTotal === 21) {
        payload.message = "You won";
        payload.isActive = "false";
        await this.userWin(userId, bet);
      }

      // Insert new blackjack session to the db
      session = await Blackjack.insertOne({ ...payload, bet });

      // Insert blackjack session to the user document
      await usersDAO.findUserByIdAndUpdate(userId, {
        blackjack: session.insertedId,
      });
    }

    const { casinoCards } = payload;

    const tempCount = await this.countTotal([casinoCards[0]]);

    // Process bet
    await usersDAO.findUserByIdAndUpdateJades(userId, bet * -1);

    return {
      ...payload,
      casinoCards: [casinoCards[0]],
      casinoTotal: tempCount,
    };
  }

  static async endSession(userId) {
    const user = await usersDAO.findUserById(userId);
    if (!user?.blackjack) throw Error("You have no sessions");

    const session = await Blackjack.findOne({ _id: user.blackjack });
    if (!session) throw Error("Session not found");

    if (session?.isActive && !session?.message)
      throw Error("Cannot end active session");

    if (!session?.isActive && !session?.message)
      throw Error("Session is invalid");

    await Blackjack.findOneAndUpdate(
      { _id: session._id },
      { $set: { message: "", isActive: false } }
    );
  }

  static async getSessionInfo(userId) {
    const user = await usersDAO.findUserById(userId);
    if (!user?.blackjack) throw Error("You have no sessions");

    const session = await Blackjack.findOne({ _id: user.blackjack });
    if (!session) throw Error("Session not found");

    const {
      userCards,
      userTotal,
      casinoCards,
      casinoTotal,
      bet,
      isActive,
      deckCount,
      message,
    } = session;

    const payload = {
      userCards,
      userTotal,
      casinoCards,
      casinoTotal,
      bet,
      isActive,
      deckCount,
      message,
    };

    if (isActive) {
      const tempCount = await this.countTotal([casinoCards[0]]);
      payload.casinoCards = [casinoCards[0]];
      payload.casinoTotal = tempCount;
    }

    return payload;
  }

  static async dealCards(session) {
    try {
      // create a temporary array of the current cards playing in order to modify it
      let deckCards = session?.deckCards;
      let deckCount = session?.deckCount;

      // If there are less than 1.25 decks playing, then reset to 6 decks
      if (!deckCards || deckCards.length < 66) {
        const sixDeckArray = Array.from({ length: 6 }, () =>
          Array.from({ length: 52 }, (_, index) => index)
        ).flat();
        deckCards = [...sixDeckArray];
        deckCount = 6;
      }

      // Shuffle cards
      deckCards = await this.shuffle(deckCards);

      // give user and casino cards
      const userCards = [deckCards.pop(), deckCards.pop()];
      const casinoCards = [deckCards.pop(), deckCards.pop()];
      const userTotal = await this.countTotal(userCards);
      const casinoTotal = await this.countTotal(casinoCards);
      const isActive = true;

      const payload = {
        deckCount,
        deckCards,
        userCards,
        userTotal,
        casinoCards,
        casinoTotal,
        isActive,
      };

      return payload;
    } catch (error) {
      console.log(error.message);
      //throw Error("Something went wrong, please try again later");
    }
  }

  /**
   * Count the cards in an array!
   */
  static async countTotal(cards) {
    let possibleTotals = [];
    let isAceInCards = cards.find((card) => card >= 48);
    let elevensToBeAdded = isAceInCards ? 1 : 0;

    while (elevensToBeAdded >= 0) {
      let total = 0;
      let elevensAdded = 0;

      for (let card of cards) {
        let isCardAce = card >= 48;
        if (isCardAce && elevensAdded !== elevensToBeAdded) {
          total += 11;
          elevensAdded++;
        } else total += cardsValues.get(card);
      }

      possibleTotals.push(total);
      elevensToBeAdded--;
    }
    possibleTotals.sort((a, b) => a - b);

    let total = 0;
    let prev = possibleTotals[0];
    for (let possibleTotal of possibleTotals) {
      if (possibleTotal > 21) return prev;
      prev = possibleTotal;
    }
    total = prev;
    return total;
  }

  static async hit(userId, blackjackSessionId) {
    // Find session
    const session = await Blackjack.findOne({ _id: blackjackSessionId });
    if (!session) throw Error("No session found");

    let isSessionActive = session?.isActive;
    if (!isSessionActive)
      throw Error("Session is not active, please start a new round");

    // Session info
    let bet = session.bet;
    let casinoCards = session.casinoCards;
    let casinoTotal = session.casinoTotal;
    let isActive = session.isActive;

    // Message placeholder
    let message;

    // Remove one card from the deck
    const deckCards = session.deckCards;
    const newCard = deckCards.pop();

    // Give user the card and update their total
    const userCards = [...session.userCards, newCard];
    const userTotal = await this.countTotal(userCards);

    // Check if the user total is 21 or above
    if (userTotal >= 21) {
      if (userTotal == 21) {
        message = await this.userWin(userId, bet);
      } else if (userTotal > 21) {
        message = await this.userLose();
      }
      isActive = false;
    }

    let payload = {
      userCards,
      userTotal,
      isActive,
      message,
    };

    await this.updateBlackjackSession(blackjackSessionId, {
      ...payload,
      deckCards,
    });

    if (!isActive) {
      return { ...payload, casinoCards, casinoTotal, bet };
    }

    return { ...payload, bet };
  }

  static async stand(userId, blackjackSessionId) {
    // Find session
    const session = await Blackjack.findOne({ _id: blackjackSessionId });
    if (!session) throw Error("No session found");
    let isSessionActive = session?.isActive;
    if (!isSessionActive)
      throw Error("Session is not active, please start a new round");

    // Message placeholder
    let message;

    // Session info
    let userTotal = session.userTotal;
    let userCards = session.userCards;
    let casinoCards = session.casinoCards;
    let casinoTotal = session.casinoTotal;
    let bet = session.bet;
    let isActive = session.isActive;

    // Check initial cards value
    if (casinoTotal == 21) {
      message = await this.userLose();
    }
    if (casinoTotal > 21) {
      message = await this.userWin(userId, bet);
    }

    // Keep drawing cards for casino
    let i = 0;
    let deckCards = session.deckCards;
    while (casinoTotal < 17) {
      casinoCards = [...casinoCards, deckCards.pop()];
      casinoTotal = await this.countTotal(casinoCards);

      if (i > 25) {
        throw Error("A cat came and threw all the cards in the floor!");
      }
      i++;
    }

    // Handle win/lose conditions
    let USER_LOSE_CONDITION_1 = casinoTotal == 21;

    let USER_LOSE_CONDITION_2 = casinoTotal > userTotal && casinoTotal < 21;

    let USER_WIN_CONDITION_1 = casinoTotal > 21;
    let USER_WIN_CONDITION_2 = casinoTotal > userTotal && casinoTotal > 21;
    let USER_WIN_CONDITION_3 = userTotal > casinoTotal && userTotal <= 21;

    if (USER_LOSE_CONDITION_1) {
      message = await this.userLose();
    } else if (USER_LOSE_CONDITION_2) {
      message = await this.userLose();
    } else if (USER_WIN_CONDITION_1) {
      message = await this.userWin(userId, bet);
    } else if (USER_WIN_CONDITION_2) {
      message = await this.userWin(userId, bet);
    } else if (USER_WIN_CONDITION_3) {
      message = await this.userWin(userId, bet);
    } else if (userTotal == casinoTotal) {
      message = await this.userPush(userId, bet);
    }

    // Update db
    isActive = false;
    const payload = {
      casinoTotal,
      casinoCards,
      isActive,
      message,
    };
    await this.updateBlackjackSession(blackjackSessionId, {
      ...payload,
      deckCards,
    });
    return { ...payload, userCards, userTotal, bet };
  }

  static async userWin(userId, bet) {
    const winPayout = bet * 2;
    usersDAO.findUserByIdAndUpdateJades(userId, winPayout);
    return "You won";
  }

  static async userLose() {
    return "You lost";
  }

  static async userPush(userId, bet) {
    const winPayout = bet;
    usersDAO.findUserByIdAndUpdateJades(userId, winPayout);
    return "Push";
  }

  static async shuffle(array) {
    let currentIndex = array.length,
      randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex > 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }
}
