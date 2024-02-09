import { generateMock } from "@anatine/zod-mock";
import {
  Body,
  Controller,
  Post,
  Route,
  SuccessResponse,
  Response,
  Get,
  Path,
  Header,
} from "tsoa";
import { DataSchema, DataSchemaIdField } from "../../schemas/Data.Schema.js";
import DataService from "../service/DataService.js";

@Route("/v1")
export class DataController extends Controller {
  private dataService: DataService;
  constructor() {
    super();

    this.dataService = new DataService();
  }

  @Get("data/:id")
  @SuccessResponse("200", "Data is succesfully fetched")
  @Response(304, "Data has not changed, return 304 Not Modified")
  async getData(
    @Path() id: string,
    @Header('If-None-Match') ifNoneMatch: string
  ) {

    if (typeof ifNoneMatch !== "string") {
      this.setStatus(400);
      return;
    }

    const { eTag, currentData } = await this.dataService.getData(
      id,
      ifNoneMatch
    );

    this.setHeader("ETag", eTag);
    this.setStatus(200);
    return currentData;
  }

  @Post("data")
  @SuccessResponse("200", "Data succesfully uploaded")
  @Response(400, "server responds with 400 if input json is invlalid.")
  async postData(@Body() inputJson: any) {
    // we need to get the schema and id field from the schema file and pass it in to the service
    // here we parameterize this based on env variables
    const { output, etag } = await this.dataService.postData(
      inputJson,
      DataSchema,
      DataSchemaIdField
    );

    // Set the ETag in the response header
    this.setHeader("ETag", etag);
    this.setStatus(200);
    return output;
  }

  @Get("mockData")
  @SuccessResponse("200", "Succesfully returned mock data")
  async getMockData() {
    return generateMock(DataSchema);
  }
}
