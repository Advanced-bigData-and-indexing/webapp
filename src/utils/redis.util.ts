import { EnvConfiguration } from "../config/env.config.js";
import { client } from "../config/redisClient.config.js";
import { ServiceUnavailableError } from "../errorHandling/Errors.js";
import { generateEtag } from "./eTag.util.js";

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
      string: string;
      eTag: string;
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
        const eTag = await client.get(`${key}:etag`);
        fetchedValues.push({
          key,
          value: {
            string: value,
            eTag: eTag || "",
          },
        });
      }
    }
  } while (cursor !== 0); // Continue until the scan returns a cursor of 0

  return fetchedValues;
}

/**
 * Methods used to interact with the redis client,
 * we will have a design an interface that can be swapped across clients
 *
 * For now we use this to perform all redis client operations for the current use case
 */

/**
 * Let's think about the naming of these methods, do we want to use a class based approach
 * or a functional approach ?
 *
 * We do not have any state, so let's stick to functional approach, but we would like to group
 * these methods together, so let;s create a redis store class
 */

export class DataStore {
  constructor() {
    // public constructor, to get new instance of DataStore
  }

  async getById(id: string): Promise<{ data: any; eTag: string | null }> {
    const data = await client.get(`${createId(id)}`);
    const eTag = await client.get(`${createId(id)}:etag`);

    return {
      data,
      eTag,
    };
  }

  async set(data: any, id: string): Promise<string> {
    try {

      // We need to change this part of the code to split the data into it's individual entities and store it
      // separately - this is where data modelling comes into the picture
      // update the data in redis under a key
      await client.set(createId(id), JSON.stringify(data));
      const etag = generateEtag(data);

      // Also split the data and save it
      await this.storePlan(id, data);

      await client.set(`${createId(id)}:etag`, etag); // Store the ETag in a related key
      return etag;
    } catch (err) {
      throw new ServiceUnavailableError("Error in redis server " + err);
    }
  }

  async deleteById(id: string): Promise<void> {
    const deleteOp1 = await client.del(createId(id));
    const deleteOp2 = await client.del(`${createId(id)}:etag`);

    if (deleteOp1 !== 1 || deleteOp2 !== 1) {
      throw new ServiceUnavailableError();
    }
  }

  // Function to store a plan object
  async storePlan(id: string, planObject : any) : Promise<void> {

    const planId = `plan:${id}`;

    await client.hSet(planId, {
      "_org" : planObject._org,
      "objectType" : planObject.objectType,
      "planType" : planObject.planType,
      "creationDate" : planObject.creationDate
    });
    
    // Store the main plan cost shares
    const planCostSharesId = `${planObject.planCostShares.objectType}:${planObject.planCostShares.objectId}`;
    await client.hSet(planCostSharesId, planObject.planCostShares);
    
    // Store linked plan services
    const promiseList =  planObject.linkedPlanServices.map( async (service:any) => {
      
        // The individual linkedPlanService
        const planserviceId = `${service.objectType}:${service.objectId}`;

        // Adding the individual linkedPlanService to the linkedPlanServices of the parent plan
        await client.sAdd(`${planId}:linkedPlanServices`, planserviceId);

        // Also creating an individual entry for the linkedPlanService
        await client.hSet(planserviceId, {
          "_org" : service._org,
          "objectType" : service.objectType,
        });
    
        // Store nested objects within the linkedPlanService like linkedService and planserviceCostShares
        const linkedServiceId = `${service.linkedService.objectType}:${service.linkedService.objectId}`;
        await client.hSet(linkedServiceId, service.linkedService);
    
        const serviceCostSharesId = `${service.planserviceCostShares.objectType}:${service.planserviceCostShares.objectId}`;
        await client.hSet(serviceCostSharesId, service.planserviceCostShares);
    });

    await Promise.all(promiseList);
  }

    
}
