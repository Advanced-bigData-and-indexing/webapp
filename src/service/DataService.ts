import crypto from "crypto";
import { ZodSchema } from "zod";
import { client } from "../config/redisClient.config.js";
import {
  BadInputError,
  BadRequestError,
  DataNotModified,
  ServiceUnavailableError,
} from "../errorHandling/Errors.js";
import { createId } from "../utils/redis.util.js";

export default class DataService {
  async getData(
    id: string,
    clientETag: string
  ): Promise<{ eTag: string; currentData: any }> {
    // Retrieve the current ETag and data from the database/cache
    let currentEtag = await client.get(`${createId(id)}:etag`);

    if (!currentEtag) {
      throw new BadRequestError();
    }

    // Compare the client's ETag with the current ETag
    if (clientETag === currentEtag) {
      // Data has not changed, return 304 Not Modified
      throw new DataNotModified("Data not modified");
    }

    const data = await client.get(`${createId(id)}`);

    if (data == null) {
      throw new BadRequestError();
    }

    // Data has changed or no ETag provided, return 200 OK with data and current ETag
    return { eTag: currentEtag, currentData: JSON.parse(data) };
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
      // console.log("data validation failed ", validation.error);
      throw new BadInputError("Invalid json object passed");
    }

    const validatedData = validation.data;

    // check if we already have this in the KV store
    const eTagPresent = await client.get(
      `${createId(validatedData[idField])}:etag`
    );

    if (eTagPresent) {
      console.log("ETag Present ", eTagPresent);
      throw new BadInputError("Data already present");
    }

    // Generate an ETag for the inputJson
    const etag = crypto
      .createHash("md5")
      .update(JSON.stringify(validatedData))
      .digest("hex");

    try {
      // update the data in redis under a key
      await client.set(
        createId(validatedData[idField]),
        JSON.stringify(validatedData)
      );
      await client.set(`${createId(validatedData[idField])}:etag`, etag); // Store the ETag in a related key
    } catch (err) {
      throw new ServiceUnavailableError("Error in redis server " + err);
    }

    // get the data that was set
    const dataAfterSave = await client.get(createId(validatedData[idField]));
    const eTagSaved = await client.get(
      `${createId(validatedData[idField])}:etag`
    );

    if (!dataAfterSave || !eTagSaved) {
      throw new ServiceUnavailableError(
        "Error in redis server " + !dataAfterSave + !eTagSaved
      );
    }

    // return updated data
    return { output: JSON.parse(dataAfterSave), etag: eTagSaved };
  }

  async deleteData(idToDelete: string, ETagToDelete: string) {
    const existingETag = await client.get(`${createId(idToDelete)}:etag`);

    if (existingETag == null) {
      throw new BadInputError("Data not present in DB");
    }

    // ETag has been modified - cannot delete something that has changed in the DB
    // Throw 400 bad request
    if (existingETag !== ETagToDelete) {
      throw new BadRequestError();
    }

    const dataInDB = await client.get(createId(idToDelete));

    if (!dataInDB) {
      throw new BadInputError("Data not present in DB");
    }

    const deleteOp1 = await client.del(createId(idToDelete));
    const deleteOp2 = await client.del(`${createId(idToDelete)}:etag`);

    if (deleteOp1 !== 1 || deleteOp2 !== 1) {
      throw new ServiceUnavailableError();
    }

    return idToDelete;
  }
}
