import { Module } from '@nestjs/common';
import { IngestionDemoController } from './ingestion-demo.controller';

@Module({
  controllers: [IngestionDemoController],
  providers: [],
  exports: [],
})
export class IngestionModule {} 