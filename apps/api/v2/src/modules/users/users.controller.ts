import { GetUser } from "@/modules/auth/decorators/get-user/get-user.decorator";
import { ApiAuthGuard } from "@/modules/auth/guards/api-auth/api-auth.guard";
import { ApiAuthGuardUser } from "@/modules/auth/strategies/api-auth/api-auth.strategy";
import { UserCreateInput } from "@/modules/users/inputs/user-create.input";
import { GenerateApiKeyResponse } from "@/modules/users/outputs/generate-api-key";
import { UserSignupResponse, UserSignupErrorResponse } from "@/modules/users/outputs/user-signup.output";
import { UsersService } from "@/modules/users/services/users.service";
import { Body, Controller, Post, HttpCode, HttpStatus, Logger, UseGuards } from "@nestjs/common";
import { ApiTags as DocsTags, ApiOperation, ApiResponse, ApiHeader } from "@nestjs/swagger";

import { SUCCESS_STATUS, ERROR_STATUS } from "@calcom/platform-constants";

@Controller("users")
@DocsTags("Users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("signup")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new user account" })
  @ApiResponse({
    status: 201,
    description: "User account created successfully",
    type: UserSignupResponse,
  })
  @ApiResponse({
    status: 409,
    description: "Username or email already taken",
    type: UserSignupErrorResponse,
  })
  @ApiResponse({
    status: 422,
    description: "Invalid input data",
    type: UserSignupErrorResponse,
  })
  async signup(@Body() body: UserCreateInput): Promise<UserSignupResponse | UserSignupErrorResponse> {
    const { email, password, username } = body;

    try {
      // Create the user with premium plan and skip email verification
      const user = await this.usersService.createPremiumUserAccount({
        username,
        email,
        password,
      });

      // Generate an API key for the user
      const apiKey = await this.usersService.generateApiKeyForUser(user.id);

      return {
        status: HttpStatus.CREATED,
        message: "User account created successfully",
        data: {
          id: user.id,
          username: user.username!,
          email: user.email,
          apiKey: apiKey,
        },
      };
    } catch (error: any) {
      if (
        error.message === "User with this email already exists" ||
        error.message === "Username is already taken"
      ) {
        return {
          status: HttpStatus.CONFLICT,
          message: error.message,
        };
      }

      Logger.error(error);

      // Handle other errors
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "An error occurred while creating the user account",
      };
    }
  }

  @UseGuards(ApiAuthGuard)
  @Post("generate-api-key")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Generate a new API key for the authenticated user" })
  @ApiHeader({
    name: "Authorization",
    description: "API key authentication in the format 'Bearer <api_key>'",
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: "API key generated successfully",
    type: GenerateApiKeyResponse,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing API key",
  })
  async generateApiKey(@GetUser() user: ApiAuthGuardUser): Promise<GenerateApiKeyResponse> {
    try {
      // Generate a new API key for the user
      const apiKey = await this.usersService.generateApiKeyForUser(user.id);

      return {
        status: SUCCESS_STATUS,
        data: {
          apiKey: apiKey,
        },
      };
    } catch (error: any) {
      Logger.error(error);

      // Handle errors
      return {
        status: ERROR_STATUS,
        message: "An error occurred while generating the API key",
        data: {
          apiKey: "",
        },
      };
    }
  }
}
