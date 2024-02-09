import "reflect-metadata";
import express from "express";
import { EnvConfiguration } from "./config/env.config.js";
// import { AppDataSource } from "./config/database.config.js";
import { configMiddleware } from "./middlewares/index.js";
import { client, connectClient } from "./config/redisClient.config.js";
// import { DBConnection } from "./entities/DBConnection.js";
class Server {
  constructor() {
    this.bootstrap();
  }

  // bootstrap
  async bootstrap() {
    checkDBConnectionRepeatedly();
    const app = express();
    configMiddleware(app);
    app.listen(EnvConfiguration.PORT, () => {
      console.log("TCP server established on port ", EnvConfiguration.PORT);
    });
  }
}

const checkDBConnectionRepeatedly = () => {
  
  // We try to see if we have established connection to the database, else we try doing it again after a given interval
  setInterval(() => {

    if (!client.isOpen) {
      connectClient()
      
        .then(async () => {

          console.log("Data Source has been initialized!");

          // const connection = (await DBConnection.find())[0] || DBConnection.create({
          //   i: 0
          // });

          // connection.i += 1;

          // await connection.save();

        })
        .catch(async (err) => {
          console.log(err);
          // catching errors - but don't want to pollute logs with a line every 1 second
          // console.error("Error during Data Source initialization retrying in 1 second", err);
        });
    }
  }, 1000);
};

new Server();
