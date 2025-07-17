import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const usePostgres = configService.get('USE_POSTGRES', 'false') === 'true';
        
        if (usePostgres) {
          return {
            type: 'postgres',
            host: configService.get('DB_HOST', 'localhost'),
            port: configService.get('DB_PORT', 5432),
            username: configService.get('DB_USERNAME', 'doc_management'),
            password: configService.get('DB_PASSWORD', 'password'),
            database: configService.get('DB_NAME', 'doc_management_db'),
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: configService.get('NODE_ENV') === 'development',
            logging: configService.get('NODE_ENV') === 'development',
            ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
          };
        } else {
          // Use SQLite for testing/development when PostgreSQL is not available
          return {
            type: 'sqlite',
            database: './data/app.db',
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            logging: configService.get('NODE_ENV') === 'development',
          };
        }
      },
      inject: [ConfigService],
    }),

    // Serve static files (for React frontend)
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          rootPath: join(__dirname, '..', 'frontend', 'build'),
          exclude: ['/api*'],
        },
      ],
      inject: [ConfigService],
    }),

    // Feature modules - real authentication with database
    AuthModule,
    UsersModule,
    DocumentsModule,
    IngestionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {} 