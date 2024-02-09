import crypto from "crypto";
import { ZodSchema } from "zod";
import { client } from "../config/redisClient.config.js";
import {
  BadInputError,
  DataNotModified,
  ServiceUnavailableError,
} from "../errorHandling/Errors.js";

export default class DataService {
  async getData(
    id: string,
    clientETag: string
  ): Promise<{ eTag: string; currentData: any }> {
    // Retrieve the current ETag and data from the database/cache
    let currentEtag = await client.get(`${id}:etag`);

    if (!currentEtag) {
      throw new ServiceUnavailableError();
    }

    // Compare the client's ETag with the current ETag
    if (clientETag === currentEtag) {
      // Data has not changed, return 304 Not Modified
      throw new DataNotModified();
    } else {
      const data = await client.get(`${id}`);

      // Data has changed or no ETag provided, return 200 OK with data and current ETag
      return { eTag: currentEtag, currentData: data };
    }
  }

  async postData(
    inputJson: any,
    schemaToTest: ZodSchema,
    idField: string
  ): Promise<{ output: any; etag: any }> {
    // we validate the input
    // Parsing the input object to see if there is an error in schema
    const validation = schemaToTest.safeParse(inputJson);

    if (!validation.success) {
      throw new BadInputError("Invalid json object passed");
    }

    const validatedData = validation.data;

    // check if we already have this in the KV store
    const eTagPresent = await client.get(`${validatedData[idField]}:etag`);

    if(eTagPresent){
      throw new BadInputError("Data already present");
    }

    // Generate an ETag for the inputJson
    const etag = crypto
      .createHash("md5")
      .update(JSON.stringify(validatedData))
      .digest("hex");

    try {
      // update the data in redis under a key
      await client.set(validatedData[idField], JSON.stringify(validatedData));
      await client.set(`${validatedData[idField]}:etag`, etag); // Store the ETag in a related key
    } catch (err) {
      throw new ServiceUnavailableError("Error in redis server " + err);
    }

    // get the data that was set
    const dataAfterSave = await client.get(validatedData[idField]);
    const eTagSaved = await client.get(`${validatedData[idField]}:etag`);

    if (!dataAfterSave || !eTagSaved) {
      throw new ServiceUnavailableError("Error in redis server " + !dataAfterSave + !eTagSaved);
    }

    // return updated data
    return { output: JSON.parse(dataAfterSave), etag: eTagSaved };
  }
}
