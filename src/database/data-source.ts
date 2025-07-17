import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config();

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'doc_management'),
  password: configService.get('DB_PASSWORD', 'password'),
  database: configService.get('DB_NAME', 'doc_management_db'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
}); 