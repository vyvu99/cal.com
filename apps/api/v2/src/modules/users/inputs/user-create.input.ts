import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, MinLength } from "class-validator";

export class UserCreateInput {
  @ApiProperty({
    description: "The username for the new user account",
    example: "johndoe",
  })
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    description: "The email address for the new user account",
    example: "john@example.com",
  })
  @IsNotEmpty()
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: "The password for the new user account",
    example: "securePassword123",
  })
  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
