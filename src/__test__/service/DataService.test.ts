import { client } from "../../config/redisClient.config";
import { createClient } from "redis";
import { z } from "zod";
import { generateMock } from "@anatine/zod-mock";
import DataService from "../../service/DataService";

import { DataSchema, DataSchemaIdField } from "../../schemas/Data.Schema";
import { BadInputError } from "../../errorHandling/Errors";

const idField = "id";
const mockSchema = z.object({
  uid: z.string(),
  theme: z.enum([`light`, `dark`]),
  email: z.string().email().optional(),
  phoneNumber: z.string().min(10).optional(),
  avatar: z.string().url().optional(),
  jobTitle: z.string().optional(),
  otherUserEmails: z.array(z.string().email()),
  stringArrays: z.array(z.string()),
  stringLength: z.string(),
  numberCount: z.number(),
  age: z.number().min(18).max(120),
  [idField]: z.string(),
});

jest.mock("redis", () => require("../RedisMocks"));

describe("Data Service", () => {
  describe("Post Data", () => {
    let dataService: DataService;
    let mockClientSet = jest.fn();
    let mockClientGet = jest.fn();

    beforeEach(() => {
      dataService = new DataService();
      mockClientSet.mockReset();
      mockClientGet.mockReset();
      client.set = mockClientSet;
      client.get = mockClientGet;
    });

    it("Should accept valid json object", async () => {
      // Set up
      const mockData = generateMock(mockSchema);

      // mock the client . set method
      mockClientSet.mockResolvedValue("OK");
      mockClientGet.mockResolvedValue(mockData);

      const output = await dataService.postData(mockData, mockSchema, idField);
      expect(output).toEqual(mockData);
    });

    it("Should throw a Bad input error if the input json is invalid", async () => {
      // Set up
      const mockData = generateMock(mockSchema);

      // pass in a different schema
      await expect(
        dataService.postData(mockData, DataSchema, DataSchemaIdField)
      ).rejects.toThrow(new BadInputError("Invalid json object passed"));
    });
  });
});
