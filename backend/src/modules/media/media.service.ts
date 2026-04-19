import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

// MIME type to extension mapping
const MIME_TYPE_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
};

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
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Get extension from MIME type map or fallback
    const ext =
      MIME_TYPE_MAP[file.mimetype] ||
      this.getExtensionFromMimetype(file.mimetype);
    const fileName = `${randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, bucket, fileName);

    // Sanitize file path to prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    const uploadDirNormalized = path.normalize(this.uploadDir);
    if (!normalizedPath.startsWith(uploadDirNormalized)) {
      throw new BadRequestException("Invalid file path");
    }

    fs.writeFileSync(normalizedPath, file.buffer);

    const url = `/uploads/${bucket}/${fileName}`;
    this.logger.log(`Uploaded ${fileName} to ${bucket}`);

    return { url, bucket, fileName };
  }

  private getExtensionFromMimetype(mimetype: string): string {
    const parts = mimetype.split("/");
    if (parts[0] === "image") return ".jpg";
    if (parts[0] === "video") return ".mp4";
    return ".bin";
  }

  async delete(bucket: string, fileName: string) {
    // Sanitize fileName to prevent directory traversal attacks
    if (fileName.includes("..") || fileName.includes("/")) {
      throw new BadRequestException("Invalid file name");
    }

    const filePath = path.join(this.uploadDir, bucket, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
