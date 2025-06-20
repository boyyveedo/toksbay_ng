import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  /**
   * Get application health status
   * @returns Application status information
   */
  getHealth(): { status: string; timestamp: string; version: string } {
    this.logger.log('Health check requested');
    
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0'
    };
  }

  /**
   * Get application information
   * @returns Basic app information
   */
  getAppInfo(): { 
    name: string; 
    description: string; 
    version: string;
    environment: string;
  } {
    return {
      name: 'Toksbay',
      description: 'REST API for e -commerce platform built with NestJS',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  }
}