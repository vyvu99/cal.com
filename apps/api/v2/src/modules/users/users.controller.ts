import { UserCreateInput } from "@/modules/users/inputs/user-create.input";
import { UserSignupResponse, UserSignupErrorResponse } from "@/modules/users/outputs/user-signup.output";
import { UsersService } from "@/modules/users/services/users.service";
import { Body, Controller, Post, HttpCode, HttpStatus, Logger } from "@nestjs/common";
import { ApiTags as DocsTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

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
}
