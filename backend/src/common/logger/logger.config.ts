import {
  format,
  transports,
  createLogger,
  Logger as WinstonLogger,
} from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

const customFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.splat(),
  format.json(),
);

const logDir = path.join(process.cwd(), 'logs');

const loggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ level, message, timestamp, context, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] ${context || 'App'}: ${message}${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        }),
      ),
    }),
    // Error log file (all errors)
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat,
    }),
    // Combined log file (all logs)
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat,
    }),
    // Application log file (info and above)
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      maxSize: '20m',
      maxFiles: '30d',
      format: customFormat,
    }),
  ],
};

export const appLogger = createLogger(loggerOptions);

export class LoggerService {
  private static loggers: Map<string, WinstonLogger> = new Map();

  static getLogger(context: string): WinstonLogger {
    if (!this.loggers.has(context)) {
      const logger = createLogger({
        ...loggerOptions,
        defaultMeta: { context },
      });
      this.loggers.set(context, logger);
    }
    return this.loggers.get(context);
  }

  static info(message: string, context?: string, meta?: any) {
    const logger = this.getLogger(context || 'App');
    logger.info(message, meta);
  }

  static error(message: string, context?: string, meta?: any) {
    const logger = this.getLogger(context || 'App');
    logger.error(message, meta);
  }

  static warn(message: string, context?: string, meta?: any) {
    const logger = this.getLogger(context || 'App');
    logger.warn(message, meta);
  }

  static debug(message: string, context?: string, meta?: any) {
    const logger = this.getLogger(context || 'App');
    logger.debug(message, meta);
  }

  static verbose(message: string, context?: string, meta?: any) {
    const logger = this.getLogger(context || 'App');
    logger.verbose(message, meta);
  }
}

export default LoggerService;
