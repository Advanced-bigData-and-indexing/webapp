import { DataSource } from "typeorm";
import { DBConnection } from "../entities/DBConnection.js";
import { User } from "../entities/User.js";
import { AddUuidToUser1707291463114 } from "../migrations/addUUIDExtensionToDB.js";
import { EnvConfiguration } from "./env.config.js";

// const AppDataSource = new DataSource({
//   // type: EnvConfiguration.DB_TYPE as "postgres",
//   // host: EnvConfiguration.DB_HOST,
//   // port: +EnvConfiguration.DB_PORT,
//   // username: EnvConfiguration.DB_USERNAME,
//   // password: EnvConfiguration.DB_PASSWORD,
//   // database: EnvConfiguration.DB_NAME,
//   // entities: [], // use path.join() for windows
//   // migrations: [
//   //   AddUuidToUser1707291463114
//   // ],
//   // synchronize: true,
//   // migrationsRun: true,
//   // logging: true,
//   // dropSchema: true,
// });

// export { AppDataSource };
