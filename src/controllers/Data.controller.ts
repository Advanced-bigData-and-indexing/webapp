import { Body, Controller, Post, Route, SuccessResponse, Response } from "tsoa";
import { DataSchema, DataSchemaIdField } from "../../schemas/Data.Schema.js";
import DataService from "../service/DataService.js";

@Route("/v1")
export default class DataController extends Controller {
  private dataService: DataService;
  constructor() {
    super();

    this.dataService = new DataService();
  }

  @Post("data")
  @SuccessResponse("200", "Data succesfully uploaded")
  @Response(400, "server responds with 400 if input json is invlalid.")
  async postData(@Body() inputJson: any) {
    // we need to get the schema and id field from the schema file and pass it in to the service
    // here we parameterize this based on env variables
    const out = await this.dataService.postData(
      inputJson,
      DataSchema,
      DataSchemaIdField
    );

    const { output, etag } = out;

    // Set the ETag in the response header
    this.setHeader("ETag", etag);
    this.setStatus(200);
    return output;
  }
}
