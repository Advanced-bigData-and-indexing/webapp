import { EnvConfiguration } from "../config/env.config.js";
import { client } from "../config/redisClient.config.js";
import {
  BadInputError,
  ServiceUnavailableError,
} from "../errorHandling/Errors.js";
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
        const eTag = await client.get(`etag:${key}`);
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

  async getIds(): Promise<string[]> {
    // return all plans in the database
    const allIds = await client.sMembers("plans");
    return allIds;
  }

  async getById(id: string): Promise<{ data: any; eTag: string | null }> {
    // Check if the key is present in the DB
    const planMetadata = await client.hExists(this.getPlanKey(id), "objectId");

    if (!planMetadata) {
      return {
        data: undefined,
        eTag: "",
      };
    }

    const data = await this.reconstructPlanObject(id);
    const eTag = await client.get(`etag:${createId(id)}`);

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
      // await client.set(createId(id), JSON.stringify(data));
      const etag = generateEtag(data);

      // Also split the data and save it
      await this.storePlan(id, data);

      await client.set(`etag:${createId(id)}`, etag); // Store the ETag in a related key
      return etag;
    } catch (err) {
      throw new ServiceUnavailableError("Error in redis server " + err);
    }
  }
  
  async deleteById(id: string): Promise<void> {
    // we need to iterate through the list and delete all the entities

    // get the plan metadata
    const planKey = this.getPlanKey(id);
    const planMetadata = await client.hGetAll(planKey);

    // now delete the key for the planCostShares
    const planCostSharesId = planMetadata.planCostSharesId;
    const planCostSharesIdKey =
      this.getPlanserviceCostSharesKey(planCostSharesId);

    await client.del(planCostSharesIdKey);

    // // next we need to iterate through the linkedPlanServices and process each linkedPlanService
    const linkedPlanServicesKey = this.getLinkedPlanServicesKey(id);
    const linkedPlanServiceIds = await client.sMembers(linkedPlanServicesKey);

    // now we have the ids , let's start processing the ids
    const promises = linkedPlanServiceIds.map(
      async (linkedPlanServiceIdKey: string) => {
        const linkedPlanServiceMetadata = await client.hGetAll(
          linkedPlanServiceIdKey
        );

        // console.log("Linked Plan Service data ", linkedPlanServiceMetadata)

        // delete the linkedService & the planserviceCostShares object within this id
        const linkedServiceKey = this.getLinkedServiceKey(
          linkedPlanServiceMetadata.linkedServiceId
        );
        await client.del(linkedServiceKey);

        const planserviceCostSharesKey = this.getPlanserviceCostSharesKey(
          linkedPlanServiceMetadata.planserviceCostSharesId
        );
        await client.del(planserviceCostSharesKey);

        // delete the keys of the linkedPlanService object
        await client.del(linkedPlanServiceIdKey);

        // delete the id from the set at the end
        // deletes the set if the last id is removed as well
        await client.sRem(linkedPlanServicesKey, linkedPlanServiceIdKey);
      }
    );

    await Promise.all(promises);

    // Delete the plan key
    await client.del(planKey);

    // remove this from the plans set
    await client.sRem("plans", planKey);

    await client.del(`etag:${createId(id)}`);
  }

  // Function to store a plan object
  async storePlan(id: string, planObject: any): Promise<void> {
    const planId = this.getPlanKey(id);

    await client.hSet(planId, {
      _org: planObject._org,
      objectType: planObject.objectType,
      planType: planObject.planType,
      creationDate: planObject.creationDate,
      planCostSharesId: planObject.planCostShares.objectId,
      objectId: id,
    });

    // Store the main plan cost shares
    const planCostSharesId = this.getPlanserviceCostSharesKey(
      planObject.planCostShares.objectId
    );
    await client.hSet(planCostSharesId, planObject.planCostShares);

    // Store linked plan services
    const promiseList = planObject.linkedPlanServices.map(
      async (service: any) => {
        // The individual linkedPlanService
        const planserviceId = this.getLinkedServiceKey(service.objectId);

        // Adding the individual linkedPlanService to the linkedPlanServices of the parent plan
        await client.sAdd(this.getLinkedPlanServicesKey(id), planserviceId);

        // Also creating an individual entry for the linkedPlanService
        await client.hSet(planserviceId, {
          _org: service._org,
          objectId: service.objectId,
          objectType: service.objectType,
          linkedServiceId: service.linkedService.objectId,
          planserviceCostSharesId: service.planserviceCostShares.objectId,
        });

        // Store nested objects within the linkedPlanService like linkedService and planserviceCostShares
        const linkedServiceId = this.getLinkedServiceKey(
          service.linkedService.objectId
        );
        await client.hSet(linkedServiceId, service.linkedService);

        const serviceCostSharesId = this.getPlanserviceCostSharesKey(
          service.planserviceCostShares.objectId
        );
        await client.hSet(serviceCostSharesId, service.planserviceCostShares);
      }
    );

    await Promise.all(promiseList);

    // add this to the list of plans
    await client.sAdd(`plans`, planId);
  }

  async reconstructPlanObject(planId: string): Promise<any> {
    try {
      // Retrieve the main plan details
      const planKey = this.getPlanKey(planId);
      const planDetails = await client.hGetAll(planKey);

      const linkedPlanServicesArray: any[] = [];

      // Initialize the plan object with fetched details
      let planObject = {
        planCostShares: {},
        linkedPlanServices: linkedPlanServicesArray,
        ...planDetails,
      };

      // Fetch linked services IDs as an array
      const linkedPlanServicesIds = await client.sMembers(
        this.getLinkedPlanServicesKey(planId)
      );

      // Retrieve each linked service and its associated cost shares
      for (let linkedPlanServiceId of linkedPlanServicesIds) {
        // get the metadata of the linkedService
        const linkedPlanServiceDetailsObject = await client.hGetAll(
          linkedPlanServiceId
        );

        // as per schema we will have a `linkedService` and a `planserviceCostShares` object as well associated
        // with this linkedServiceId

        // get the metadata of the associated linkedService
        const linkedServiceObjectId = this.getLinkedServiceKey(
          linkedPlanServiceDetailsObject.linkedServiceId
        );
        const linkedServiceObject = await client.hGetAll(linkedServiceObjectId);

        // get the metadata of the associated 'planserviceCostShares'
        const planserviceCostSharesObjectId = this.getPlanserviceCostSharesKey(
          linkedPlanServiceDetailsObject.planserviceCostSharesId
        );
        const planserviceCostSharesObject = await client.hGetAll(
          planserviceCostSharesObjectId
        );

        const linkedPlanServiceObject = {
          linkedService: linkedServiceObject,
          planserviceCostShares: planserviceCostSharesObject,
          ...linkedPlanServiceDetailsObject,
        };

        planObject.linkedPlanServices.push(linkedPlanServiceObject);
      }

      // retrieve the planCostShares details
      const planCostSharesId = this.getPlanserviceCostSharesKey(
        planDetails.planCostSharesId
      );
      const planCostSharesObject = await client.hGetAll(planCostSharesId);

      planObject.planCostShares = planCostSharesObject;

      return planObject;
    } catch (error) {
      console.error("Failed to reconstruct the plan object:", error);
      throw error;
    }
  }

  // This function takes in the payload and updates the existing data in cache
  async updatePlanObject(updatedPlanObject: any): Promise<any> {
    const planId = updatedPlanObject.objectId;

    // first check if we have this object in memory
    const existingPlan = await client.hGet(this.getPlanKey(planId), "objectId");

    // if this plan does not exists or if the plan's id in cache is different from the input id
    if (!existingPlan || existingPlan !== planId) {
      console.log(
        "Plan does not exists or the plan's id in cache is different from the input id"
      );
      throw new BadInputError(
        "Plan does not exists or the plan's id in cache is different from the input id"
      );
    }

    // get the existing metaata
    const planMetadata = await client.hGetAll(this.getPlanKey(planId));

    // Updating the plan cost shared object ============================
    // Here we are going with the assumption that we are only updating the metadata of the plan cost shares object
    // throw an error if an entirely new `planCostShares` id is sent
    const planCostSharesId = planMetadata.planCostSharesId;

    if (planCostSharesId !== updatedPlanObject.planCostShares.objectId) {
      console.log(
        "This plan cost shares object is not associaced with this plan object"
      );
      throw new BadInputError(
        "This plan cost shares object is not associaced with this plan object"
      );
    }

    // update the planCostShares object in cache
    const planCostSharesIdInCache =
      this.getPlanserviceCostSharesKey(planCostSharesId);
    await client.hSet(
      planCostSharesIdInCache,
      updatedPlanObject.planCostShares
    );

    // Updating the linkedPlanServices array

    // parse through the linkedPlanServicesArray provided in the `updatedPlanObject` and compare it with the
    // existing linkedPlanServicesArray in cache
    const existingLinkedPlanServicesArrayId =
      this.getLinkedPlanServicesKey(planId);
    const members = await client.sMembers(existingLinkedPlanServicesArrayId);

    // iterate through incoming linkedPlanServices
    const promises = updatedPlanObject.linkedPlanServices.map(
      async (linkedPlanService: any) => {
        // check if this is a member
        const linkedPlanServiceId = this.getLinkedServiceKey(
          linkedPlanService.objectId
        );
        const isMember = await client.sIsMember(
          existingLinkedPlanServicesArrayId,
          linkedPlanServiceId
        );

        if (isMember) {
          // we update the member

          // this further has to be broken down to individual parts

          // check if the linkedService && planserviceCostShares ids are the same
          const linkedServiceExistingId = await client.hGet(
            linkedPlanServiceId,
            "linkedServiceId"
          );
          const planserviceCostSharesExistingId = await client.hGet(
            linkedPlanServiceId,
            "planserviceCostSharesId"
          );

          if (
            linkedServiceExistingId !==
              linkedPlanService.linkedService.objectId ||
            planserviceCostSharesExistingId !==
              linkedPlanService.planserviceCostShares.objectId ||
            linkedServiceExistingId == undefined ||
            planserviceCostSharesExistingId == undefined
          ) {
            throw new BadInputError(
              "Ill formed linkedPlanService object passed as input"
            );
          }

          // linkedService - update metadata
          await client.hSet(
            this.getLinkedServiceKey(linkedServiceExistingId),
            linkedPlanService.linkedService
          );

          // planserviceCostShares
          await client.hSet(
            this.getPlanserviceCostSharesKey(planserviceCostSharesExistingId),
            linkedPlanService.planserviceCostShares
          );

          // metadata
          await client.hSet(linkedPlanServiceId, {
            _org: linkedPlanService._org,
            objectId: linkedPlanService.objectId,
            objectType: linkedPlanService.objectType,
            linkedServiceId: linkedPlanService.linkedService.objectId,
            planserviceCostSharesId:
              linkedPlanService.planserviceCostShares.objectId,
          });
        } else {
          // we add it to the list

          // we need to do everything that was done in the initial create command
          // The individual linkedPlanService
          const planserviceId = this.getLinkedServiceKey(
            linkedPlanService.objectId
          );

          // Adding the individual linkedPlanService to the linkedPlanServices of the parent plan
          await client.sAdd(
            this.getLinkedPlanServicesKey(planId),
            planserviceId
          );

          // Also creating an individual entry for the linkedPlanService
          await client.hSet(planserviceId, {
            _org: linkedPlanService._org,
            objectId: linkedPlanService.objectId,
            objectType: linkedPlanService.objectType,
            linkedServiceId: linkedPlanService.linkedService.objectId,
            planserviceCostSharesId:
              linkedPlanService.planserviceCostShares.objectId,
          });

          // Store nested objects within the linkedPlanService like linkedService and planserviceCostShares
          const linkedServiceId = this.getLinkedServiceKey(
            linkedPlanService.linkedService.objectId
          );
          await client.hSet(linkedServiceId, linkedPlanService.linkedService);

          const serviceCostSharesId = this.getPlanserviceCostSharesKey(
            linkedPlanService.planserviceCostShares.objectId
          );
          await client.hSet(
            serviceCostSharesId,
            linkedPlanService.planserviceCostShares
          );
        }
      }
    );

    await Promise.all(promises);

    //  updating the plan metadata
    await client.hSet(`plan:${planId}`, {
      _org: updatedPlanObject._org,
      objectType: updatedPlanObject.objectType,
      planType: updatedPlanObject.planType,
      creationDate: updatedPlanObject.creationDate,
      planCostSharesId: updatedPlanObject.planCostShares.objectId,
      objectId: planId,
    });
  }

  getPlanKey(planId: string) {
    return `plan:${planId}`;
  }

  getPlanserviceCostSharesKey(planserviceCostSharesId: string) {
    return `planserviceCostShares:${planserviceCostSharesId}`;
  }

  getLinkedServiceKey(linkedServiceId: string) {
    return `linkedService:${linkedServiceId}`;
  }

  getLinkedPlanServicesKey(planId: string) {
    return `plan:${planId}:linkedPlanServices`;
  }
}
