import { generateMock } from "@anatine/zod-mock";
import { z } from "zod";
import DataService from "../../service/DataService";
import DataController from "../../controllers/Data.controller"

jest.mock("../../service/DataService");

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

describe("Data Controller", () => {
  let mockDataService: jest.Mocked<DataService>;
  let dataController : DataController;

  describe("Post", () => {
    beforeEach(() => {
        dataController = new DataController();
      // Here we cast the instance to have jest.Mock types for its methods
      mockDataService = new DataService() as jest.Mocked<DataService>;
      mockDataService.postData.mockClear(); // Clear mocks if necessary
    });

    it("Should return 200 when data is succesfully uploaded", async () => {

        // it should take in the input json data
        const mockData = generateMock(mockSchema);

        // it shuold call the service with the other required params
        await dataController.postData(mockData);

        // it shuould return a 200
        expect(dataController.getStatus()).toBe(200);
         
    });
  });
});
