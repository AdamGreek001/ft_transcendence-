import { IsString, IsUUID, IsOptional, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SendMessageDto {
    @ApiProperty({ description: "Receiver user ID" })
    @IsUUID()
    receiverId: string;

    @ApiProperty({ description: "Message content", maxLength: 2000 })
    @IsString()
    @MinLength(1)
    @MaxLength(2000)
    content: string;
}

export class CreateConversationDto {
    @ApiProperty({ description: "User ID to start conversation with" })
    @IsUUID()
    userId: string;

    @ApiPropertyOptional({ description: "Optional conversation name (for groups)" })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;
}

export class GetMessagesQueryDto {
    @ApiPropertyOptional({ description: "Page number", default: 1 })
    @IsOptional()
    page?: number = 1;

    @ApiPropertyOptional({ description: "Items per page", default: 50 })
    @IsOptional()
    limit?: number = 50;
}
