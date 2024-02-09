import {
  Body,
  Controller,
  Patch,
  Post,
  Route,
  Request,
  Get,
  SuccessResponse,
  Put,
  Tags,
} from "tsoa";
import express from "express";
import ModelMapper from "./ModelMapper.js";
import DataService from "../service/DataService.js";
import { DataSchema } from "../schemas/Data.Schema.js";

@Route("/v1")
export class DataController extends Controller {
  private dataService: DataService;
  constructor() {
    super();

    this.dataService = new DataService();
  }

  @Get("data")
  async getData(
    @Body() inputJson: JSON
  ) {

    
    this.setStatus(200);
    return;
  }

}
