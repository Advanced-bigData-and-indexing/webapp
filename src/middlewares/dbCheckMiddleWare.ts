import { DBConnection } from "../entities/DBConnection.js";

// setting up database check for the user end point
export const dbCheck = async (req: any, res: any, next: any) => {
  if (req.path === "/v1/user/self" || req.path === "/v1/user") {
    try {
      const connection = (await DBConnection.find())[0];
      if (connection) {
        next();
      } else {
        res.status(503).end();
      }
    } catch (error: any) {
      res.status(503).end();
    }
  } else {
    next();
  }
};
