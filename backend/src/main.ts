import 'dotenv/config'; 
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS: set CORS_ORIGIN to a comma-separated list to restrict origins,
  // otherwise all origins are allowed (default, since the frontend is served from this same app).
  const corsOrigin = process.env.CORS_ORIGIN;
  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',').map((s) => s.trim()) : true,
    credentials: true,
  });

  // Serve the built frontend (from the Docker build) when it exists next to the app.
  const publicDir = join(process.cwd(), 'public');
  app.useStaticAssets(publicDir);

  // SPA fallback: send index.html for any non-GET / non-GraphQL / non-asset path.
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/graphql')) return next();
    if (req.path.includes('.')) return next();
    res.sendFile(join(publicDir, 'index.html'));
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(
    `پلتفرم مدیریت مشتریان API running on http://localhost:${port}/graphql`,
  );
}
bootstrap();
