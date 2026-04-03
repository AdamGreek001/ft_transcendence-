import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

@ApiTags("Health")
@Controller("health")
export class HealthController {
    constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

    @Get()
    @ApiOperation({ summary: "Health check" })
    async check() {
        try {
            await this.dataSource.query("SELECT 1");
            return { status: "ok", database: "connected" };
        } catch {
            return { status: "error", database: "disconnected" };
        }
    }
}
