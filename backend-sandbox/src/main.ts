import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

const parseOrigins = (value: string | undefined): string[] | boolean => {
  if (!value) return true;
  const parts = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length === 0) return true;
  return parts;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const origins = parseOrigins(process.env.CORS_ORIGINS);
  app.enableCors({
    origin: origins,
    credentials: true,
  });
  app.use(cookieParser());
  const port = Number(process.env.APP_PORT || process.env.PORT || 4000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Sandbox backend listening on ${port}`);
}

void bootstrap();
