import { IsString, IsOptional, Length, Matches } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Username can only contain letters, numbers, and underscores",
  })
  username?: string;

  @IsOptional()
  @IsString()
  @Length(0, 35)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
