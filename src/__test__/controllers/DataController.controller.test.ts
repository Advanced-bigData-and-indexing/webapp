import { generateMock } from "@anatine/zod-mock";
import { z } from "zod";
import DataService from "../../service/DataService";
import { DataController } from "../../controllers/Data.controller";
import { DataSchema } from "../../../schemas/Data.Schema";
import { client } from "../../config/redisClient.config";

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

describe("Data Controller", () => {
  let mockDataService: DataService;
  let dataController: DataController;
  let mockDataServicePost = jest.fn();

  let mockClientSet = jest.fn();
  let mockClientGet = jest.fn();

  describe("Post", () => {
    beforeEach(() => {
      mockDataServicePost.mockReset();
      dataController = new DataController();
      // Here we cast the instance to have jest.Mock types for its methods
      mockDataService = new DataService();
      mockDataService.postData = mockDataServicePost;


      mockClientSet.mockReset();
      mockClientGet.mockReset();
      client.set = mockClientSet;
      client.get = mockClientGet;
    });

    it("Should return 200 when data is succesfully uploaded", async () => {
      // it should take in the input json data
      const mockData = generateMock(DataSchema);

      // make the mock data service return output and Etag
      mockDataServicePost.mockResolvedValue({ output: mockData, etag: "" });

      // it shuold call the service with the other required params
      await dataController.postData(mockData);

      // it shuould return a 200
      expect(dataController.getStatus()).toBe(200);
    });

    it("Should contain the ETag in the response headers on success", async () => {
      // it should take in the input json data
      const mockData = generateMock(DataSchema);
      mockDataServicePost.mockResolvedValueOnce({
        output: mockData,
        etag: "",
      });

      // it shuold call the service with the other required params
      await dataController.postData(mockData);

      // it shuould return a 200
      expect(dataController.getHeader("ETag")).toBeDefined();
    });
  });
});
