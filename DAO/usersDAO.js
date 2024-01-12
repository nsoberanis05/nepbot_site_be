let Users;
import mongodb, { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import Axios from "axios";

/**
 * @todo
 * - [  ] Modify functions to improve clarity and readability, attach comments if necessary
 * - [  ] Modify functions so they throw errors to improve API responses
 * - [ x ] Attach comments on deprecated functions
 *
 * Functions for this class will throw errors, please wrap them in trycatch blocks
 */
export default class usersDAO {
  static async injectDB(conn) {
    if (Users) {
      return;
    }
    try {
      Users = await conn.db("JadeHive").collection("users");
      return;
    } catch (error) {
      console.error(
        `unable to establish a collection handle in usersDAO: ${error}`
      );
    }
  }

  /** @deprecated discord OAuth is the preffered method of authenticating the user */
  static async findUserByUsername(username) {
    try {
      const result = await Users.find({
        username: new RegExp("^" + username + "$", "i"),
      }).toArray();
      if (result) {
        return result;
      }
      if (!result) {
        return null;
      }
    } catch (error) {
      console.error(`Unable to find user in findUserByUsername: ${error}`);
      return null;
    }
  }

  static async findUserByDiscordId(discordId) {
    try {
      const result = await Users.findOne({ discordId: discordId });
      if (result) {
        return result;
      }
      if (!result) {
        return null;
      }
    } catch (error) {
      console.error(`Unable to find user in findUserByDiscrodId: ${error}`);
      return null;
    }
  }

  static async findUserById(id) {
    if (id?.length <= 11) throw Error("Invalid user id");
    try {
      const result = await Users.findOne({ _id: new ObjectId(id) });
      if (result) {
        return result;
      }
      if (!result) {
        throw Error("No user found");
      }
    } catch (error) {
      throw Error("Something went wrong, please try again later");
    }
  }

  static async findUserByIdAndUpdate(_id, payload) {
    if (_id?.length <= 11) throw Error("Invalid user id");
    try {
      const result = await Users.findOneAndUpdate(
        { _id: new ObjectId(_id) },
        { $set: { ...payload } }
      );
      if (result) {
        return result;
      }
      if (!result) {
        throw Error("No user found");
      }
    } catch (error) {
      throw Error("Something went wrong, please try again later");
    }
  }

  /** @deprecated discord OAuth is the preffered method of authenticating the user */
  static async findUserByEmail(email) {
    if (!email) return;
    try {
      const result = await Users.findOne({ email: email });
      if (result) {
        return result;
      } else {
        return;
      }
    } catch (error) {
      console.error(`Unable to find user: ${error}`);
    }
  }

  static async findUserByIdAndUpdateJades(id, jadesToAdd) {
    try {
      const result = await Users.findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $inc: {
            jades: jadesToAdd,
          },
        }
      );
      if (!result) throw Error("No user found");
      return jadesToAdd;
    } catch (error) {
      console.error(`Unable to find user: ${error}`);
      throw Error("Something went wrong, please try again later");
    }
  }

  static async findUserByDiscordIdAndUpdateAvatar(discordId, avatar) {
    try {
      const result = await Users.findOneAndUpdate(
        { discordId },
        {
          $set: {
            avatarUrl: `https://cdn.discordapp.com/avatars/${discordId}/${avatar}`,
          },
        }
      );
      if (result) {
        return avatar;
      }
      if (!result) {
        return undefined;
      }
    } catch (error) {
      console.error(
        `Unable to find user in findeUserByDiscordIdAndUpdateAvatar: ${error}`
      );
    }
  }

  static async findTopUsersByJades() {
    try {
      const topTenUsers = [];
      const users = await Users.find().limit(10).sort({ jades: -1 }).toArray();
      for (const user of users) {
        if (!user.discordId) continue;
        const userLatest = await Axios.get(
          `https://discord.com/api/users/${user.discordId}`,
          {
            headers: {
              Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
            },
          }
        );

        const { id, avatar, username, discriminator } = userLatest.data;

        topTenUsers.push({
          avatarUrl: `https://cdn.discordapp.com/avatars/${id}/${avatar}`,
          username,
          discriminator,
          jades: user.jades,
        });
      }

      return topTenUsers;
    } catch (error) {
      console.log(error);
    }
  }

  static async createUserFromDiscord({
    discordId,
    username,
    avatar,
    discriminator,
  }) {
    try {
      let newUsername = "";
      // returns array of users with that username, should be only 1 result or 0
      let USERNAME_ALREADY_IN_USE = await usersDAO.findUserByUsername(username);
      // prevents too many searches / infinite loop
      let i = 0;
      // generates new usernames in case user tries to make account with username already used in the database
      while (USERNAME_ALREADY_IN_USE.length && i < 10) {
        newUsername = `${username}${Math.round(Math.random() * 9999999)}`;
        USERNAME_ALREADY_IN_USE = await usersDAO.findUserByUsername(
          newUsername
        );
        i++;
      }
      // if everything went wrong so far, this gets called
      if (USERNAME_ALREADY_IN_USE.length) {
        console.log("--------------------------------------");
        console.log(` !!! Username cannot be generated i:${i}`);
        console.log(USERNAME_ALREADY_IN_USE);
        console.log("--------------------------------------");
        return null;
      }
      // if we generated a new username for user, this gets triggered
      else if (i > 0) {
        username = newUsername;
      }

      // we should be fine now
      await Users.insertOne({
        discordId,
        username,
        avatarUrl: `https://cdn.discordapp.com/avatars/${discordId}/${avatar}`,
        jades: 10000,
        discriminator,
        lastDaily: new Date(),
        level: 1,
        xp: 0,
        dailyStreak: 1,
      });

      return `User created`;
    } catch (e) {
      console.error(
        `unable to establish a collection handle in projectsDAO: ${e}`
      );
      return null;
    }
  }

  /** @deprecated discord OAuth is the preffered method of authenticating the user */
  static async createUser({ username, password, email }) {
    if (!email || !password) {
      throw Error("All fields must be filled");
    }
    const emailAlreadyExists = await usersDAO.findUserByEmail(email);
    const usernameAlreadyExists = await usersDAO.findUserByUsername(username);
    if (emailAlreadyExists) {
      throw Error("User already exists with this email");
    } else if (usernameAlreadyExists) {
      throw Error("User already exists with this username");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const userInserted = await Users.insertOne({
      username,
      password: hash,
      email,
      jades: 10000,
      avatarUrl: `https://img.freepik.com/free-vector/cute-cat-sitting-cartoon-vector-icon-illustration-animal-nature-icon-concept-isolated-premium-flat_138676-6708.jpg?w=826&t=st=1692064229~exp=1692064829~hmac=f28fb4a3bc91d69d6b362d8e4cd0bd3bb759c315d697b84870fd307c77707f8a`,
    });

    const user = await usersDAO.findUserById(userInserted.insertedId);
    return user;
  }
  /** @deprecated discord OAuth is the preffered method of authenticating the user */
  static async loginUser({ password, email }) {
    if (!email || !password) {
      throw Error("All fields must be filled");
    }

    const user = await usersDAO.findUserByEmail(email);

    if (!user) {
      throw Error("Incorrect email");
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw Error("Incorrect password");
    }

    return user;
  }
}
