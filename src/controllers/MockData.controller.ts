import { generateMock } from "@anatine/zod-mock";
import { Controller, Get, Route, SuccessResponse, Tags } from "tsoa";
import { DataSchema } from "../../schemas/Data.Schema.js";

@Route("/v1/mockData")
@Tags("Utility")
export class MockDataController extends Controller {
  
  constructor() {
    super();
  }

  @Get("")
  @SuccessResponse("200", "Succesfully returned mock data")
  async getMockData() {
    return generateMock(DataSchema);
  }
}
