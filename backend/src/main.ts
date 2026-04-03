import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);

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
