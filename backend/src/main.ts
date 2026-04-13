import { NestFactory, Reflector } from "@nestjs/core";
import { ValidationPipe, ClassSerializerInterceptor } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { join } from "path";
import { NestExpressApplication } from "@nestjs/platform-express";
import * as express from "express";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix("api");

  // CORS
  app.enableCors({
    origin: "http://localhost:3000", // URL dyal Next.js
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

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
