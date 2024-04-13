import { ZodSchema } from "zod";
import {
  BadInputError,
  BadRequestError,
  DataNotModified,
  PreConditionRequiredError,
  ServiceUnavailableError,
} from "../errorHandling/Errors.js";
import { generateEtag } from "../utils/eTag.util.js";
import { DataStore } from "../utils/redis.util.js";

export default class DataService {

  dataStore = new DataStore();

  async getAllData() : Promise<any[]> {
    
    // get all keys
    const keys = await this.dataStore.getIds();

    const data: any[] = [];
    // for each key get the data
    const promises = keys.map( async (key:string) => {

      // strip the key word plan from the key
      const tokens = key.split(":");

      const planObj =  await this.dataStore.getById(tokens[1]);

      data.push(planObj);

    })
    
    await Promise.all(promises);

    return data;

    
  }

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
    return { eTag, currentData: data };
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
      console.log("data already present error");
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
      throw new PreConditionRequiredError();
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
    idField: string,
    etagForIncomingJson : string
  ): Promise<string> {
    const validatedData = this.validateData(inputJson, schemaToTest);

    // check if we already have this key in the kv store
    const { eTag, data } = await this.dataStore.getById(idToPatch);

    if (!eTag || !data) {
      throw new BadInputError("Data not present");
    }

    // Data is present

    // check if eTag has not changed
    if (eTag == etagForIncomingJson) {
      throw new DataNotModified("Update payload identical to existing json");
    }

    // We need a function to modify the existing data based on the input
    await this.dataStore.updatePlanObject(validatedData);

    const updatedData = await this.dataStore.reconstructPlanObject(validatedData.objectId);

    const updatedEtag = generateEtag(updatedData);

    // we have a different payload
    return updatedEtag;
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

}
