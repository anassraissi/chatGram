import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

async function bootstrap() {
  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    
    // Get MongoDB connection and add event listeners
    try {
      const connection = app.get<Connection>(getConnectionToken());
      
      // Check connection state
      if (connection.readyState === 1) {
        console.log('✅ MongoDB connected successfully');
      } else {
        console.log('⏳ Waiting for MongoDB connection...');
        
        // Wait for connection (non-blocking - don't fail if it takes time)
        const connectionPromise = new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            console.warn('⚠️ MongoDB connection timeout - server will start anyway');
            console.warn('⚠️ Make sure MongoDB is running: mongodb://localhost:27017');
            resolve(); // Don't reject, just continue
          }, 5000); // Shorter timeout
          
          if (connection.readyState === 1) {
            clearTimeout(timeout);
            console.log('✅ MongoDB connected successfully');
            resolve();
          } else {
            connection.once('connected', () => {
              clearTimeout(timeout);
              console.log('✅ MongoDB connected successfully');
              resolve();
            });
          }
        });
        
        // Don't await - let it happen in background
        connectionPromise.catch(() => {
          // Ignore errors, server should still start
        });
      }
      
      connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
        console.error('⚠️ Make sure MongoDB is running: mongodb://localhost:27017');
      });
      
      connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
      
      connection.on('connected', () => {
        console.log('✅ MongoDB connected successfully');
      });
    } catch (connectionError) {
      console.error('❌ Failed to get MongoDB connection:', connectionError);
      console.error('⚠️ Make sure MongoDB is running and MONGODB_URI is correct');
      console.warn('⚠️ Server will start anyway, but database operations will fail');
    }
  
  // Enhanced static file serving
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    dotfiles: 'allow',
    setHeaders: (res, path) => {
      // Set proper headers for images
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      } else if (path.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
      } else if (path.endsWith('.mov')) {
        res.setHeader('Content-Type', 'video/quicktime');
      } else if (path.endsWith('.avi')) {
        res.setHeader('Content-Type', 'video/x-msvideo');
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    },
  });
  
  // Enable CORS for frontend
  app.enableCors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
  
  // Global validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
    const port = process.env.PORT || 3001;
    await app.listen(port);
    console.log(`🚀 Backend running on: http://localhost:${port}`);
    console.log(`📁 File uploads served from: http://localhost:${port}/uploads/`);
    console.log(`📸 Test image: http://localhost:${port}/uploads/1763407197813-25512036.jpg`);
  } catch (error) {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
  }
}
bootstrap();