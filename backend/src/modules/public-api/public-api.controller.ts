import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { PublicApiService } from "./public-api.service";

@ApiTags("Public API")
@Controller("public")
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class PublicApiController {
    constructor(private readonly publicApiService: PublicApiService) { }

    @Get("users/:username")
    @ApiOperation({ summary: "Get public user profile" })
    async getUser(@Param("username") username: string) {
        return this.publicApiService.getPublicProfile(username);
    }

    @Get("users/:username/posts")
    @ApiOperation({ summary: "Get public user posts" })
    async getUserPosts(
        @Param("username") username: string,
        @Query("page") page = 1,
        @Query("limit") limit = 20,
    ) {
        return this.publicApiService.getUserPosts(username, +page, +limit);
    }

    @Get("posts/trending")
    @ApiOperation({ summary: "Get trending posts" })
    async getTrending(@Query("limit") limit = 20) {
        return this.publicApiService.getTrendingPosts(+limit);
    }

    @Get("stats")
    @ApiOperation({ summary: "Get platform statistics" })
    async getStats() {
        return this.publicApiService.getPlatformStats();
    }

    @Get("posts/:id")
    @ApiOperation({ summary: "Get a specific post by ID" })
    async getPost(@Param("id") id: string) {
        return this.publicApiService.getPost(id);
    }
}
