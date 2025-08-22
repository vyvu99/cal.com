import { ApiProperty } from "@nestjs/swagger";

export class UserSignupData {
  @ApiProperty({
    description: "The unique identifier of the user",
    example: 1,
  })
  id!: number;

  @ApiProperty({
    description: "The username of the user",
    example: "johndoe",
  })
  username!: string;

  @ApiProperty({
    description: "The email address of the user",
    example: "john@example.com",
  })
  email!: string;

  @ApiProperty({
    description: "The API key generated for the user",
    example: "cal_1234567890abcdef1234567890abcdef",
  })
  apiKey!: string;
}

export class UserSignupResponse {
  @ApiProperty({
    description: "HTTP status code",
    example: 201,
  })
  status!: number;

  @ApiProperty({
    description: "Message describing the result of the operation",
    example: "User account created successfully",
  })
  message!: string;

  @ApiProperty({
    description: "Data returned from the operation",
    type: UserSignupData,
  })
  data!: UserSignupData;
}

export class UserSignupErrorResponse {
  @ApiProperty({
    description: "HTTP status code",
    example: 409,
  })
  status!: number;

  @ApiProperty({
    description: "Message describing the error",
    example: "User with this email already exists",
  })
  message!: string;
}
