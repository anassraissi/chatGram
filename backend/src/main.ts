import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Change from 3000 to 3001 to avoid conflict with frontend
  await app.listen(3001);
  
  console.log('Backend running on http://localhost:3001');
}
bootstrap();