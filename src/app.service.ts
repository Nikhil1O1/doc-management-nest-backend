import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  getHealthCheck(): { message: string; timestamp: string; environment: string } {
    return {
      message: 'Document Management API is running successfully!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getDetailedHealth(): { status: string; uptime: number; timestamp: string } {
    const uptime = Date.now() - this.startTime;
    
    return {
      status: 'OK',
      uptime: Math.floor(uptime / 1000), // uptime in seconds
      timestamp: new Date().toISOString(),
    };
  }
} 