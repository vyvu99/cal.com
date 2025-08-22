import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { IsEmail, IsTimeZone } from "class-validator";

class UpdateBookingAttendee {
  @ApiPropertyOptional({ type: String, example: "John Doe" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ type: String, example: "john@example.com" })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ type: String, example: "America/New_York" })
  @IsTimeZone()
  timeZone!: string;

  @ApiPropertyOptional({ type: String, example: "+1234567890" })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}

export class UpdateBookingInput_2024_08_13 {
  @ApiPropertyOptional({ type: String, example: "Updated Consultation" })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ type: String, example: "Updated description." })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: String, example: "2024-08-13T16:00:00Z" })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ type: String, example: "2024-08-13T17:00:00Z" })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ type: String, example: "New Location" })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    type: Object,
    example: { newKey: "newValue" },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ type: [UpdateBookingAttendee] })
  @ValidateNested({ each: true })
  @Type(() => UpdateBookingAttendee)
  @IsArray()
  @IsOptional()
  attendees?: UpdateBookingAttendee[];

  @ApiPropertyOptional({
    type: Object,
    description:
      "Booking field responses consisting of an object with booking field slug as keys and user response as values.",
    example: { customField: "updatedCustomValue" },
  })
  @IsObject()
  @IsOptional()
  bookingFieldsResponses?: Record<string, unknown>;
}
