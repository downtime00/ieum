import { Injectable } from '@nestjs/common';
import { LoggerService as CustomLogger } from './logger.config';

@Injectable()
export class AppLogger {
  private context: string;

  constructor(context?: string) {
    this.context = context || 'App';
  }

  log(message: any, meta?: any) {
    CustomLogger.info(message, this.context, meta);
  }

  error(message: any, meta?: any) {
    CustomLogger.error(message, this.context, meta);
  }

  warn(message: any, meta?: any) {
    CustomLogger.warn(message, this.context, meta);
  }

  debug(message: any, meta?: any) {
    CustomLogger.debug(message, this.context, meta);
  }

  verbose(message: any, meta?: any) {
    CustomLogger.verbose(message, this.context, meta);
  }

  static log(message: any, context?: string, meta?: any) {
    CustomLogger.info(message, context || 'App', meta);
  }

  static error(message: any, context?: string, meta?: any) {
    CustomLogger.error(message, context || 'App', meta);
  }

  static warn(message: any, context?: string, meta?: any) {
    CustomLogger.warn(message, context || 'App', meta);
  }

  static debug(message: any, context?: string, meta?: any) {
    CustomLogger.debug(message, context || 'App', meta);
  }

  static verbose(message: any, context?: string, meta?: any) {
    CustomLogger.verbose(message, context || 'App', meta);
  }
}

export { CustomLogger };
