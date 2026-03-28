import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "./prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
    constructor(private readonly prisma: PrismaService) { }

    @Get()
    @ApiOperation({ summary: "Health check" })
    async check() {
        await this.prisma.$queryRaw`SELECT 1`;
        return { status: "ok", timestamp: new Date().toISOString() };
    }
}
