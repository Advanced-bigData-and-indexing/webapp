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

    currentEtag = JSON.parse(currentEtag);

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

    // Generate an ETag for the inputJson
    const etag = crypto
      .createHash("md5")
      .update(JSON.stringify(inputJson))
      .digest("hex");

    try {
      // update the data in redis under a key
      await client.set(inputJson[idField], JSON.stringify(inputJson));
      await client.set(`${inputJson[idField]}:etag`, JSON.stringify(etag)); // Store the ETag in a related key
    } catch (err) {
      throw new ServiceUnavailableError("Error in redis server " + err);
    }

    // get the data that was set
    const data = await client.get(inputJson[idField]);
    const eTagSaved = await client.get(`${inputJson[idField]}:etag`);

    if (!data || !eTagSaved) {
      throw new ServiceUnavailableError("Error in redis server");
    }

    // return updated data
    return { output: JSON.parse(data), etag: JSON.parse(eTagSaved) };
  }
}
