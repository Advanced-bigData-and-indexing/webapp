import { JsonObjectExpression } from "typescript";
import { ZodSchema } from "zod";
import { client } from "../config/redisClient.config.js";
import { BadInputError } from "../errorHandling/Errors.js";

export default class DataService {

  async getData(): Promise<any> {
    return "";
  }

  async postData(inputJson: any, schemaToTest: ZodSchema, idField : string): Promise<any> {
    // we validate the input
    // Parsing the input object to see if there is an error in schema
    const validation = schemaToTest.safeParse(inputJson);

    if (!validation.success) {
      throw new BadInputError("Invalid json object passed");
    }

    // update the data in redis under a key
    await client.set(inputJson[idField], inputJson);

    // get the data that was set
    const data = await client.get(inputJson[idField]);


    // return updated data
    return data;
  }
}
