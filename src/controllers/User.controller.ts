// import {
//   Body,
//   Controller,
//   Patch,
//   Post,
//   Route,
//   Request,
//   Get,
//   SuccessResponse,
//   Put,
//   Tags,
// } from "tsoa";
// import express from "express";
// import UserService from "../service/UserService.js";
// import ModelMapper from "./ModelMapper.js";
// import { CreateUserAccount } from "./requestModels/CreateUserAccount.js";
// import { UpdateUserAccount } from "./requestModels/UpdateUserAccount.js";
// import { UserResponse } from "./responseModels/UserResponse.js";

// @Route("/v1")
// export class UserController extends Controller {
//   private userService: UserService;
//   constructor() {
//     super();

//     this.userService = new UserService();
//   }

//   @Get("user/self")
//   @Tags("authenticated")
//   async getUser(@Request() req: express.Request) {
//     /**
//      * Get User Information
//      */
//     const userName = req.user?.userName;

//     const existingUser = await this.userService.getUser(userName);

//     const response = ModelMapper(UserResponse, existingUser);

//     this.setStatus(200);
//     return response;
//   }

//   @Post("user")
//   @Tags("public")
//   @SuccessResponse(201)
//   async createUser(
//     @Body() userDetails: CreateUserAccount
//   ): Promise<UserResponse> {
//     /**
//      * Create a user
//      */
//     const newUser = await this.userService.createUser(userDetails);

//     const response = ModelMapper(UserResponse, newUser);

//     this.setStatus(201);
//     return response;
//   }

//   @Put("user/self")
//   @Tags("authenticated")
//   async updateUser(
//     @Request() req: express.Request,
//     @Body() updatedUserDetails: UpdateUserAccount
//   ): Promise<UserResponse> {
//     /**
//      * Update user information
//      */
//     let userName = req.user?.userName;

//     const updatedUser = await this.userService.updateUser(
//       updatedUserDetails,
//       userName
//     );

//     const response = ModelMapper(UserResponse, updatedUser);

//     this.setStatus(201);
//     return response;
//   }
// }
