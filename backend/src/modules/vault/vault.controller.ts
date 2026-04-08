import { Controller, Get } from "@nestjs/common";
import { VaultService } from "./vault.service";

@Controller("vault")
export class VaultController {
    constructor(private readonly vaultService: VaultService) {}

    @Get("health")
    health() {
        return {
            status: this.vaultService.isVaultAvailable() ? "connected" : "fallback",
            source: this.vaultService.isVaultAvailable() ? "vault" : "environment",
        };
    }
}
