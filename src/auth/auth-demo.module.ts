import { Module } from '@nestjs/common';
import { AuthDemoController } from './auth-demo.controller';

@Module({
  controllers: [AuthDemoController],
  providers: [],
  exports: [],
})
export class AuthModule {} 