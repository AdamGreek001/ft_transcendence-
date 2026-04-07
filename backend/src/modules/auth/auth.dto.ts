import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterDto {
    @ApiProperty({ example: "johndoe" })
    @IsString()
    @MinLength(3)
    @MaxLength(30)
    username!: string;

    @ApiProperty({ example: "john@example.com" })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: "securepassword" })
    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;
}

export class LoginDto {
    @ApiProperty({ example: "john@example.com" })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: "securepassword" })
    @IsString()
    password!: string;
}

export class GoogleOAuthDto {
    @ApiProperty({ description: "Authorization code from Google OAuth" })
    @IsString()
    code!: string;
}
