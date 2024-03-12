import { EnvConfiguration } from "../config/env.config.js";
import { client } from "../config/redisClient.config.js";

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

/**
 * fetchValuesByPattern is an asynchronous function
 * designed to fetch all values from a Redis database
 * for keys that match a given pattern.
 * It utilizes the Redis SCAN command to iteratively
 * search through the keyspace without blocking the database,
 * making it suitable for use with large datasets.
 * For each matching key, it retrieves the corresponding value
 * using the GET command.
 * @returns
 */
export async function fetchValuesByPattern(): Promise<
  {
    key: string;
    value: {
      string: string,
      eTag: string
    };
  }[]
> {
  const pattern = `*-${EnvConfiguration.DATA_TYPE}`;

  let cursor = 0; // Initialize cursor as a number
  const fetchedValues = [];

  do {
    // Adjust the call to match expected parameter types, particularly cursor as number
    const reply = await client.scan(cursor, {
      MATCH: pattern,
      COUNT: 100, // This helps with performance in larger datasets
    });

    // Update cursor with the new position returned from the scan
    cursor = reply.cursor;
    const keys = reply.keys;

    for (let key of keys) {
      const value = await client.get(key);
      if (value !== null) {
        // Ensure that a value was actually returned
        // also fetch the eTag of the key
        const eTag = await client.get(`${key}:etag`)
        fetchedValues.push({ key, value: {
          string: value,
          eTag: eTag || ""
        } });
      }
    }
  } while (cursor !== 0); // Continue until the scan returns a cursor of 0

  return fetchedValues;
}
