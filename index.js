import app from "./server.js";
import mongodb from "mongodb";
import dotenv from "dotenv";
import usersDAO from "./DAO/usersDAO.js";
import blackjackDAO from "./DAO/blackjackDAO.js";
import coinflipDAO from "./DAO/coinflipDAO.js";
dotenv.config();
const MongoClient = mongodb.MongoClient;
const port = process.env.PORT || 5000;
MongoClient.connect(process.env.MONGODB_URI, {
  maxPoolSize: 50,
  wtimeoutMS: 2500,
})
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  })
  .then(async (client) => {
    // DAO -> Data Access Object
    await usersDAO.injectDB(client);
    await blackjackDAO.injectDB(client);
    await coinflipDAO.injectDB(client);
    app.listen(port, () => {
      console.log(`listening on port ${port}`);
    });
    app.set("trust proxy", 1);
  });
