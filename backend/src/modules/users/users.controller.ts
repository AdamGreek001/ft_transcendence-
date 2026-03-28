import { Controller, Get, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Users")
@Controller("users")
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get(":username")
    @ApiOperation({ summary: "Get user profile by username" })
    async getProfile(@Param("username") username: string) {
        return this.usersService.findByUsername(username);
    }

    @Patch(":id")
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: "Update user profile" })
    async updateProfile(
        @Param("id") id: string,
        @Body() body: { displayName?: string; bio?: string },
    ) {
        return this.usersService.updateProfile(id, body);
    }

    @Get(":id/followers")
    @ApiOperation({ summary: "Get user followers" })
    async getFollowers(@Param("id") id: string) {
        return this.usersService.getFollowers(id);
    }

    @Get(":id/following")
    @ApiOperation({ summary: "Get users this user follows" })
    async getFollowing(@Param("id") id: string) {
        return this.usersService.getFollowing(id);
    }
}
