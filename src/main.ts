import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { MainModule } from './main.module';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(MainModule);
    const isDevelopment = process.env.NODE_ENV === 'development';

    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                    'script-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
                    'connect-src': ["'self'", 'https://cdn.jsdelivr.net', 'https://api.scalar.com'],
                    'img-src': ["'self'", 'data:', 'cdn.jsdelivr.net'],
                    'style-src': ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
                },
            },
        }),
    );
    app.use(cookieParser());
    app.enableCors({
        origin: true,
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(app.get(ResponseInterceptor));
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

    if (isDevelopment) {
        const config = new DocumentBuilder()
            .setTitle('Nest JS RESTful API Starter Kit')
            .setDescription('This is a starter kit for a create RESTful API with Nest JS Framework')
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(app, config);

        app.use(
            '/api-reference',
            apiReference({
                theme: 'elysiajs',
                layout: 'modern',
                content: document,
                darkMode: true,
            }),
        );
    }

    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
