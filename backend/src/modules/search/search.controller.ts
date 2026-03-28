import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { SearchService } from "./search.service";

@ApiTags("Search")
@Controller("search")
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Get()
    @ApiOperation({ summary: "Search users and posts" })
    async search(@Query("q") query: string, @Query("type") type?: "users" | "posts") {
        return this.searchService.search(query, type);
    }
}
