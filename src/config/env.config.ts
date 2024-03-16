import dotenv from "dotenv";

dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
class EnvConfiguration {
  // APP
  static PORT = process.env.PORT;
  static NODE_ENV = process.env.NODE_ENV;

  // DB
  static DB_TYPE = process.env.DB_TYPE;
  static DB_HOST = process.env.DB_HOST;
  static DB_PORT = process.env.DB_PORT || 5432;
  static DB_USERNAME = process.env.DB_USERNAME;
  static DB_PASSWORD = process.env.DB_PASSWORD;
  static DB_NAME = process.env.DB_NAME;

  // LOG
  static LOG_LEVEL = process.env.LOG_LEVEL;

  static DATA_TYPE = process.env.DATA_TYPE;

  static CLIENT_ID=process.env.CLIENT_ID;

  static ISSUER=process.env.ISSUER;

  static JWK_URL=process.env.REMOTE_JWK_URL;
}

export enum Environment {
  DEVELOPMENT = "DEVELOPMENT",
  PRODUCTION = "PRODUCTION",
  TEST = "TEST",
}

export { EnvConfiguration };
