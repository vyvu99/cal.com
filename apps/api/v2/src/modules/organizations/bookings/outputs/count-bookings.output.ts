import { ApiProperty } from "@nestjs/swagger";
import { IsNumber } from "class-validator";

export class CountBookingsOutput {
  @ApiProperty({
    description: "The total number of bookings matching the criteria.",
    example: 100,
  })
  @IsNumber()
  count!: number;
}
