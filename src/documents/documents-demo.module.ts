import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsDemoController } from './documents-demo.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [DocumentsDemoController],
  providers: [],
  exports: [],
})
export class DocumentsModule {} 