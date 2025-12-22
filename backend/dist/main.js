"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const app_module_1 = require("./app.module");
const mongoose_1 = require("@nestjs/mongoose");
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule);
        try {
            const connection = app.get((0, mongoose_1.getConnectionToken)());
            if (connection.readyState === 1) {
                console.log('✅ MongoDB connected successfully');
            }
            else {
                console.log('⏳ Waiting for MongoDB connection...');
                const connectionPromise = new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        console.warn('⚠️ MongoDB connection timeout - server will start anyway');
                        console.warn('⚠️ Make sure MongoDB is running: mongodb://localhost:27017');
                        resolve();
                    }, 5000);
                    if (connection.readyState === 1) {
                        clearTimeout(timeout);
                        console.log('✅ MongoDB connected successfully');
                        resolve();
                    }
                    else {
                        connection.once('connected', () => {
                            clearTimeout(timeout);
                            console.log('✅ MongoDB connected successfully');
                            resolve();
                        });
                    }
                });
                connectionPromise.catch(() => {
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
        }
        catch (connectionError) {
            console.error('❌ Failed to get MongoDB connection:', connectionError);
            console.error('⚠️ Make sure MongoDB is running and MONGODB_URI is correct');
            console.warn('⚠️ Server will start anyway, but database operations will fail');
        }
        app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), {
            prefix: '/uploads/',
            dotfiles: 'allow',
            setHeaders: (res, path) => {
                if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
                    res.setHeader('Content-Type', 'image/jpeg');
                }
                else if (path.endsWith('.png')) {
                    res.setHeader('Content-Type', 'image/png');
                }
                else if (path.endsWith('.gif')) {
                    res.setHeader('Content-Type', 'image/gif');
                }
                else if (path.endsWith('.webp')) {
                    res.setHeader('Content-Type', 'image/webp');
                }
                else if (path.endsWith('.mp4')) {
                    res.setHeader('Content-Type', 'video/mp4');
                }
                else if (path.endsWith('.mov')) {
                    res.setHeader('Content-Type', 'video/quicktime');
                }
                else if (path.endsWith('.avi')) {
                    res.setHeader('Content-Type', 'video/x-msvideo');
                }
                res.setHeader('Cache-Control', 'public, max-age=31536000');
            },
        });
        app.enableCors({
            origin: 'http://localhost:3000',
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }));
        const port = process.env.PORT || 3001;
        await app.listen(port);
        console.log(`🚀 Backend running on: http://localhost:${port}`);
        console.log(`📁 File uploads served from: http://localhost:${port}/uploads/`);
        console.log(`📸 Test image: http://localhost:${port}/uploads/1763407197813-25512036.jpg`);
    }
    catch (error) {
        console.error('❌ Failed to start application:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map