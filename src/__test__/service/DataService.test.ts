import { client } from "../../config/redisClient.config";
import { z } from "zod";
import { generateMock } from "@anatine/zod-mock";
import DataService from "../../service/DataService";
import crypto from "crypto";
import { DataSchema, DataSchemaIdField } from "../../../schemas/Data.Schema";
import {
  BadInputError,
  BadRequestError,
  DataNotModified,
  ServiceUnavailableError,
} from "../../errorHandling/Errors";
import { generateEtag } from "../../utils/eTag.util";
const mockETag = "a8e483df6dbcaff58dc94279113206a4";
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
      mockClientSet.mockResolvedValueOnce("OK");
      mockClientGet
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify(mockData))
        .mockResolvedValueOnce(mockETag);

      const eTag = await dataService.postData(
        mockData,
        mockSchema,
        idField
      );
      expect(eTag).toEqual(generateEtag(mockData));
    });

    it("Should return the ETag value along with the inserted json object if succesful", async () => {
      // Set up
      const mockData = generateMock(mockSchema);

      // mock the client . set method
      mockClientSet.mockResolvedValue("OK");
      mockClientGet
        .mockResolvedValueOnce(null)
        .mockResolvedValue(JSON.stringify(mockData));

      const etag = await dataService.postData(
        mockData,
        mockSchema,
        idField
      );
      expect(etag).toBeDefined();
    });

    it("Should throw a Bad input error if the input json is invalid", async () => {
      // Set up
      const mockData = generateMock(mockSchema);

      // pass in a different schema
      await expect(
        dataService.postData(mockData, DataSchema, DataSchemaIdField)
      ).rejects.toThrow(new BadInputError("Invalid json object passed"));
    });

    it("Should throw a Bad Input Error if key of same id is present", async () => {
      // Set up
      const mockData = generateMock(mockSchema);

      // data is already present
      mockClientGet.mockResolvedValueOnce(JSON.stringify(mockData));

      // expect method to fail
      await expect(
        dataService.postData(mockData, mockSchema, idField)
      ).rejects.toThrow(new BadInputError("Data already present"));
    });
  });

  describe("Get Data", () => {
    let dataService: DataService;
    let mockClientGet = jest.fn();

    beforeEach(() => {
      dataService = new DataService();
      mockClientGet.mockReset();
      client.get = mockClientGet;
    });

    it("Should return the data when there is a change in the ETag", async () => {
      const existingETag = mockETag;

      const incomingETag = crypto
        .createHash("md5")
        .update(mockETag)
        .digest("hex");

      const idToGet = "xyz";

      const dataInStorage = generateMock(mockSchema);

      // We check in redis if there already is a key for the etag
      // in this case it isn't present
      mockClientGet
        .mockResolvedValueOnce(existingETag) // fetch the existing eTag
        .mockResolvedValueOnce(JSON.stringify(dataInStorage)); // we go ahead and get the data

      const out = await dataService.getData(idToGet, incomingETag);

      // expect this to contain the data and the changed eTag in storage
      // { eTag: currentEtag, currentData: data }
      expect(out).toHaveProperty("eTag");
      expect(out).toHaveProperty("currentData");

      // expect the returned eTag to be the one in the database
      expect(out.eTag).toEqual(existingETag);
    });

    it("Should throw a 302 Data Not Modified Error if the ETag is the same", async () => {
      // set up
      let dataToGetId = "xyz";
      let clientETag = mockETag;
      let savedETag = mockETag;

      // first the etag in the DB is checked
      // in this case the etag in the db is the same
      mockClientGet.mockResolvedValueOnce(savedETag);

      mockClientGet.mockResolvedValueOnce(JSON.stringify({}));

      // This causes the method to throw a Data Not Modified Error
      await expect(
        dataService.getData(dataToGetId, clientETag)
      ).rejects.toThrow(new DataNotModified("Data not modified"));
    });

    it("Should return a 400 Bad request when data does not exist or eTag does not exist", async () => {
      const incomingETag = mockETag;

      const idToGet = "xyz";

      // Case when ETag does not exist
      mockClientGet.mockResolvedValue(null); // we go ahead and get the data

      await expect(
        dataService.getData(idToGet, incomingETag)
      ).rejects.toThrow(new BadRequestError());

      mockClientGet.mockReset();
      mockClientGet
      .mockResolvedValueOnce("randomETag")
      .mockResolvedValue(null); // when data does not exist

      await expect(
        dataService.getData(idToGet, incomingETag)
      ).rejects.toThrow(new BadRequestError());      

    });
  });

  describe("Delete Data", () => {
    let dataService: DataService;
    let mockClientGet = jest.fn();
    let mockClientDelete = jest.fn();

    beforeEach(() => {
      dataService = new DataService();
      client.get = mockClientGet;
      client.del = mockClientDelete;
    });

    it("Should return the id of the object on succesful delete", async () => {
      // we give it an id and an eTag
      const idToDelete = "xyz";
      const ETagToDelete = mockETag;

      // it's checked if that eTag is present for that id
      // and that it is equal to the input eTag
      mockClientGet
        .mockResolvedValueOnce(ETagToDelete)
        .mockResolvedValueOnce(JSON.stringify({})); // it is checked if that key is present

      // run the delete operation - return code 1
      mockClientDelete.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      const deletedId = await dataService.deleteData(idToDelete, ETagToDelete);

      // return the id of the deleted object from the service method
      expect(deletedId).toEqual(idToDelete);
    });

    it("Should return a 400 Bad Input error when entity not present in the db or ETag not present", async () => {
      // we give it an id and an eTag
      const idToDelete = "xyz";
      const ETagToDelete = mockETag;

      // it's checked if that eTag is present for that id
      // and that it is equal to the input eTag
      mockClientGet.mockResolvedValue(null);

      await expect(
        dataService.deleteData(idToDelete, ETagToDelete)
      ).rejects.toThrow(new BadInputError("Data not present in DB"));

      mockClientGet.mockReset();

      mockClientGet
        .mockResolvedValueOnce(ETagToDelete)
        .mockResolvedValueOnce(null);

      await expect(
        dataService.deleteData(idToDelete, ETagToDelete)
      ).rejects.toThrow(new BadInputError("Data not present in DB"));
    });

    it("Should throw a 400 when data has changed in the database", async () => {
      // we give it an id and an eTag
      const idToDelete = "xyz";
      const ETagToDelete = mockETag;

      // it's checked if that eTag is present for that id
      // and in cases that ETag is different form the one present
      mockClientGet.mockResolvedValue(mockETag + "xyz");

      await expect(
        dataService.deleteData(idToDelete, ETagToDelete)
      ).rejects.toThrow(new BadInputError());
    });

    it("Throws a 503 when there is an issue with deleteing the entries from the DB", async () => {
      // we give it an id and an eTag
      const idToDelete = "xyz";
      const ETagToDelete = mockETag;

      // it's checked if that eTag is present for that id
      // and that it is equal to the input eTag
      mockClientGet
        .mockResolvedValueOnce(ETagToDelete)
        .mockResolvedValueOnce(JSON.stringify({})); // it is checked if that key is present

      // run the delete operation - it returns code that is not == 1 because there is an issue
      mockClientDelete.mockResolvedValueOnce(0).mockResolvedValueOnce(-1);

      await expect(
        dataService.deleteData(idToDelete, ETagToDelete)
      ).rejects.toThrow(new ServiceUnavailableError());
    });
  });
});
