import { EnvConfiguration } from "../config/env.config.js";

/**
 * In this function to represent that we are storing a plan object in the KV store
 * We create an alternate id that contains the word plan in it
 * For now we just append the word plan at the end
 * 
 * This method will only be used for the current use case, for other use cases we will
 * have to think of maybe adding another method or parametrizing this
 * @param incomingId the object id that is passed from the client - probably an UUID
 */
export const createId = (incomingId: string) => {
  return `${incomingId}-${EnvConfiguration.DATA_TYPE}`;
};
