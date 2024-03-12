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
  Tags,
  Delete,
} from "tsoa";
import { DataSchema, DataSchemaIdField } from "../../schemas/Data.Schema.js";
import DataService from "../service/DataService.js";
import { fetchValuesByPattern } from "../utils/redis.util.js";

@Route("/v1/data")
@Tags("Demo")
export class DataController extends Controller {
  private dataService: DataService;
  constructor() {
    super();

    this.dataService = new DataService();
  }

  @Get("/:id")
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

  @Get("")
  @SuccessResponse("200", "Data is succesfully fetched")
  async getAllData() {
    const data = await fetchValuesByPattern();
    return data;
  }

  @Post("")
  @SuccessResponse("201", "Data succesfully uploaded")
  @Response("400", "server responds with 400 if input json is invlalid.")
  async postData(@Body() inputJson: any) : Promise<void> {
    // we need to get the schema and id field from the schema file and pass it in to the service
    // here we parameterize this based on env variables
    const { output, etag } = await this.dataService.postData(
      inputJson,
      DataSchema,
      DataSchemaIdField
    );

    // Set the ETag in the response header
    this.setHeader("ETag", etag);
    this.setStatus(201);
    return;
  }

  @Delete("/:id")
  @SuccessResponse("204", "Data was succesfully deleted")
  @Response("428", "Precondition Required - the data has been modified since last update" )
  @Response("400", "Data is not present in the DB")
  async deleteData(
    @Path() id: string,
    @Header('If-None-Match') ifNoneMatch: string
  ) {
    return await this.dataService.deleteData(id, ifNoneMatch);
  }
}
