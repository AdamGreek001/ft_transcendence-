import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";
import * as fs from "fs";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    const config = app.get(ConfigService);

    // Serve static files from uploads directory
    const isDocker = fs.existsSync("/app") && process.cwd().startsWith("/app");
    const uploadDir = isDocker ? "/app/uploads" : join(process.cwd(), "uploads");
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    app.useStaticAssets(uploadDir, {
        prefix: "/uploads/",
    });

    // Global prefix
    app.setGlobalPrefix("api");

    // CORS
    app.enableCors({
        origin: config.get<string>("CORS_ORIGIN", "https://localhost"),
        credentials: true,
    });

    // Validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );

    // Serialization (removes @Exclude() fields from responses)
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // WebSocket adapter
    app.useWebSocketAdapter(new IoAdapter(app));

    // Swagger API docs
    const swaggerConfig = new DocumentBuilder()
        .setTitle("ft_transcendence API")
        .setDescription("Social platform REST API")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);

    const port = config.get<number>("BACKEND_PORT", 3001);
    await app.listen(port);
    console.log(`Application running on port ${port}`);
}

bootstrap();
