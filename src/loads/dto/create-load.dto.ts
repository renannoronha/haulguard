import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { LoadStatus } from "../enums/load-status.enum";

export class CreateLoadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  origin: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  destination: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cargoType: string;

  @IsEnum(LoadStatus)
  status: LoadStatus;
}
