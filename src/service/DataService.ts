import { ZodSchema } from "zod";
import {
  BadInputError,
  BadRequestError,
  DataNotModified,
  ServiceUnavailableError,
} from "../errorHandling/Errors.js";
import { generateEtag } from "../utils/eTag.util.js";
import { DataStore } from "../utils/redis.util.js";

export default class DataService {
  dataStore = new DataStore();

  async getData(
    id: string,
    clientETag: string
  ): Promise<{ eTag: string; currentData: any }> {
    const { data, eTag } = await this.dataStore.getById(id);

    if (eTag == null || data == null) {
      throw new BadRequestError();
    }

    // Compare the client's ETag with the current ETag
    if (clientETag === eTag) {
      // Data has not changed, return 304 Not Modified
      throw new DataNotModified("Data not modified");
    }

    // Data has changed or no ETag provided, return 200 OK with data and current ETag
    return { eTag, currentData: JSON.parse(data) };
  }

  async postData(
    inputJson: any,
    schemaToTest: ZodSchema,
    idField: string
  ): Promise<string> {
    const validatedData = this.validateData(inputJson, schemaToTest);

    const id = validatedData[idField];

    const { eTag, data } = await this.dataStore.getById(id);

    // check if we already have data for this id in the KV store
    if (eTag || data) {
      throw new BadInputError("Data already present");
    }

    await this.dataStore.set(validatedData, id);

    // get the data that was set
    const existingData = await this.dataStore.getById(id);

    if (!existingData.data || !existingData.eTag) {
      throw new ServiceUnavailableError("Error in redis server");
    }

    // return updated data
    return existingData.eTag;
  }

  async deleteData(idToDelete: string, ETagToDelete: string) {
    const { eTag, data } = await this.dataStore.getById(idToDelete);

    if (eTag == null || data == null) {
      console.log("data not present in db");
      throw new BadInputError("Data not present in DB");
    }

    // ETag has been modified - cannot delete something that has changed in the DB
    // Throw 400 bad request
    if (eTag !== ETagToDelete) {
      console.log("please pass correct e Tag");
      throw new BadRequestError();
    }

    if (!data) {
      throw new BadInputError("Data not present in DB");
    }

    await this.dataStore.deleteById(idToDelete);
  }

  async patchData(
    idToPatch: string,
    inputJson: any,
    schemaToTest: ZodSchema,
    idField: string
  ): Promise<string> {
    const validatedData = this.validateData(inputJson, schemaToTest);

    // check if we already have this key in the kv store
    const { eTag, data } = await this.dataStore.getById(idToPatch);

    if (!eTag || !data) {
      throw new BadInputError("Data not present");
    }

    // Data is present

    // Generate an ETag for the incoming json
    const etagForIncomingJson = generateEtag(validatedData);
  
    // check if eTag has not changed
    if (eTag == etagForIncomingJson) {
      throw new DataNotModified("Update payload identical to existing json");
    }

    // We need a function to modify the existing data based on the input

    const updatedData = this.patch(validatedData, JSON.parse(data), idField);

    // we have a different payload
    // now we need to replace the value for this key with this updated payload
    // set content for this key to new payload
    return await this.dataStore.set(updatedData, idToPatch);
  }

  private validateData(inputJson: any, schemaToTest: ZodSchema): any {
    // we validate the input
    // Parsing the input object to see if there is an error in schema
    const validation = schemaToTest.safeParse(inputJson);

    if (!validation.success) {
      throw new BadInputError("Invalid json object passed");
    }

    return validation.data;
  }

  /**
   *
   * @param payload Incoming payload to update
   * @param existingDataCopy Data object that needs to be updated
   * @param idField The key in the object that holds the id of the object
   */
  private patch(payload: any, existingDataCopy: any, idField: string) {
    // we need to iterate through the keys of the payload and
    // apply the changes to the same key on the existing data

    const keys = Object.keys(payload);
    // values can be arrays, strings, number or objects

    for (const key of keys) {
      const val = existingDataCopy[key];
      if (Array.isArray(val)) {
        const existingArray = val;
        // get the array value in the incoming payload
        const incomingArray = payload[key];

        // now check each entry in the incoming array
        // if the entry does not exist in the exisitng array, append it
        // else patch it
        for(let i = 0 ; i < incomingArray.length; i++){
          const obj = incomingArray[i];
          // does this key exist ?
          const existingObject = existingArray.filter(
            (x: any) => x[idField] == obj[idField]
          )[0];
          if (!existingObject) {
            // append this new object to the array
            existingArray.push(obj);
          } else {;
            const indexOfExistingObject = existingArray.indexOf(existingObject);
            const patchedOutput = this.patch(obj, existingObject, idField);
            // find the index of this object in the existing array and update the
            existingArray[indexOfExistingObject] = patchedOutput;
          }
        }
      } else if (typeof val == "object") {
        existingDataCopy[key] = this.patch(payload[key], val, idField);
      } else {
        // just update this key with the incoming field
        existingDataCopy[key] = payload[key];
      }
    }

    return existingDataCopy;
  }
}
