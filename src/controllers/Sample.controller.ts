import { Controller, Get, Response, Route, SuccessResponse, Tags } from "tsoa";
@Route("/")
@Tags("public")
export class SampleController extends Controller {
  constructor() {
    super();
  }

  @Get("sample")
  @SuccessResponse(200, "server responds with 200 OK if it is healhty.")
  @Response(503, "server responds with 503 if it is not healhty.")
  public async checkConnection(): Promise<void> {
    /**
     * Health endpoint
     */
    try {
      //   const connection = (await DBConnection.find())[0];
      //   if (connection) {
      //     this.setStatus(200);
      //   } else {
      //     this.setStatus(503);
      //   }
      this.setStatus(200);
    } catch (error: any) {
      this.setStatus(503);
    }
    return;
  }
}
