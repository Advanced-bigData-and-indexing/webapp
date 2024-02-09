import { Controller, Delete, Get, Head, Options, Post, Put, Response, Route, SuccessResponse, Tags } from "tsoa";
import { DBConnection } from "../entities/DBConnection.js";

@Route("/")
@Tags("public")
export class HealthCheckController extends Controller {
  constructor() {
    super();
  }

  @Get("healthz")
  @SuccessResponse(200, "server responds with 200 OK if it is healhty.")
  @Response(503, "server responds with 503 if it is not healhty.")
  public async checkConnection(): Promise<void> {
    /**
     * Health endpoint
     */
    try {
      const connection = (await DBConnection.find())[0];
      if (connection) {
        this.setStatus(200);
      } else {
        this.setStatus(503);
      }
    } catch (error: any) {
      this.setStatus(503);
    }
    return;
  }
  @Post("healthz")
  @Response(405, "server responds with 405 Method Not Allowed.")
  public async checkConnectionPost(): Promise<void> {
    /**
     * Health endpoint
     */
     this.setStatus(405);
    return;
  }

  @Put("healthz")
  @Response(405, "server responds with 405 Method Not Allowed.")
  public async checkConnectionPut(): Promise<void> {
    /**
     * Health endpoint
     */
    this.setStatus(405);
    return;
  }
  @Delete("healthz")
  @Response(405, "server responds with 405 Method Not Allowed.")
  public async checkConnectionDelete(): Promise<void> {
    /**
     * Health endpoint
     */
    this.setStatus(405);
    return;
  }
  @Head("healthz")
  @Response(405, "server responds with 405 Method Not Allowed.")
  public async checkConnectionHead(): Promise<void> {
    /**
     * Health endpoint
     */
    this.setStatus(405);
    return;
  }
  @Options("healthz")
  @Response(405, "server responds with 405 Method Not Allowed.")
  public async checkConnectionOptions(): Promise<void> {
    /**
     * Health endpoint
     */
    this.setStatus(405);
    return;
  }  
}
