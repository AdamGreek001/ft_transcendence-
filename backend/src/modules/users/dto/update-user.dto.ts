import { IsString, IsOptional, Length } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(3, 20)
  username?: string;

  @IsOptional()
  @IsString()
  @Length(0, 50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}