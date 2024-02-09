import { ErrorRequestHandler } from "express";
import { ValidateError } from "tsoa";
import { HTTPStatusCode } from "../utils/httpStatusCode.util.js";
import {
  AuthError,
  BadInputError,
  BadRequestError,
  NotFoundError,
} from "./Errors.js";

// noinspection JSUnusedLocalSymbols
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof ValidateError) {
    res.status(400).end();
  } else if (error instanceof NotFoundError) {
    res.status(HTTPStatusCode.OK).end();
  } else if (error instanceof BadInputError) {
    res.status(HTTPStatusCode.BAD_REQUEST).end();
  } else if (error instanceof BadRequestError) {
    res.status(HTTPStatusCode.BAD_REQUEST).end();
  } else if (error instanceof AuthError) {
    res.status(HTTPStatusCode.UNAUTHORIZED).end();
  } else {
    console.log(error);
    res.status(HTTPStatusCode.INTERNAL_SERVER_ERROR).end();
  }
};
