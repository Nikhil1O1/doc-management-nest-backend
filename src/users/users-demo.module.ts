import { Module } from '@nestjs/common';
import { UsersDemoController } from './users-demo.controller';

@Module({
  controllers: [UsersDemoController],
  providers: [],
  exports: [],
})
export class UsersModule {} 