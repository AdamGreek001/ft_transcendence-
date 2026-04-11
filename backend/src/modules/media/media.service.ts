import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);
    private readonly uploadDir: string;

    constructor(private readonly config: ConfigService) {
        // Use local uploads directory when running outside Docker
        // Check if /app exists (Docker) or use local cwd/uploads
        const isDocker = fs.existsSync("/app") && process.cwd().startsWith("/app");
        const defaultDir = isDocker
            ? "/app/uploads" 
            : path.join(process.cwd(), "uploads");
        this.uploadDir = config.get<string>("UPLOAD_DIR", defaultDir);
        this.ensureDirectories();
    }

    private ensureDirectories() {
        const dirs = ["avatars", "posts", "media", "chat"];
        for (const dir of dirs) {
            const fullPath = path.join(this.uploadDir, dir);
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                this.logger.log(`Created directory: ${fullPath}`);
            }
        }
    }

    async upload(bucket: string, file: Express.Multer.File) {
        const ext = file.originalname.split(".").pop() || "bin";
        const fileName = `${randomUUID()}.${ext}`;
        const filePath = path.join(this.uploadDir, bucket, fileName);

        fs.writeFileSync(filePath, file.buffer);

        const url = `/uploads/${bucket}/${fileName}`;
        this.logger.log(`Uploaded ${fileName} to ${bucket}`);

        return { url, bucket, fileName };
    }

    async delete(bucket: string, fileName: string) {
        const filePath = path.join(this.uploadDir, bucket, fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}
