import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface VaultSecret {
    data: {
        data: Record<string, string>;
        metadata: {
            created_time: string;
            version: number;
        };
    };
}

interface VaultResponse {
    data: VaultSecret["data"];
}

@Injectable()
export class VaultService implements OnModuleInit {
    private readonly logger = new Logger(VaultService.name);
    private readonly addr: string;
    private readonly token: string;
    private secretsCache: Map<string, Record<string, string>> = new Map();
    private isConnected = false;

    constructor(private readonly configService: ConfigService) {
        this.addr = this.configService.get<string>("VAULT_ADDR", "http://vault:8200");
        this.token = this.configService.get<string>("VAULT_TOKEN", "");
    }

    async onModuleInit() {
        if (!this.token) {
            this.logger.warn("VAULT_TOKEN not configured, using env vars as fallback");
            return;
        }

        try {
            await this.fetchSecrets();
            this.isConnected = true;
            this.logger.log("Vault connected and secrets loaded");
        } catch (error) {
            this.logger.error(`Failed to connect to Vault: ${error.message}`);
            this.logger.warn("Falling back to environment variables");
        }
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.addr}/v1/${path}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "X-Vault-Token": this.token,
                "Content-Type": "application/json",
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`Vault request failed: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    async fetchSecrets(secretPath = "secret/data/ft_transcendence"): Promise<void> {
        try {
            const response = await this.request<VaultResponse>(secretPath);
            this.secretsCache.set(secretPath, response.data.data);
            this.logger.debug(`Fetched secrets from ${secretPath}`);
        } catch (error) {
            this.logger.error(`Failed to fetch secrets: ${error.message}`);
            throw error;
        }
    }

    getSecret(key: string, fallback?: string): string {
        if (this.isConnected) {
            const secrets = this.secretsCache.get("secret/data/ft_transcendence");
            if (secrets && secrets[key]) {
                return secrets[key];
            }
        }
        return fallback || process.env[key] || "";
    }

    getJwtSecret(): string {
        return this.getSecret("jwt_secret", process.env.JWT_SECRET);
    }

    getPostgresPassword(): string {
        return this.getSecret("postgres_password", process.env.POSTGRES_PASSWORD);
    }

    getGoogleClientId(): string {
        return this.getSecret("google_client_id", process.env.GOOGLE_CLIENT_ID);
    }

    getGoogleClientSecret(): string {
        return this.getSecret("google_client_secret", process.env.GOOGLE_CLIENT_SECRET);
    }

    isVaultAvailable(): boolean {
        return this.isConnected;
    }
}
