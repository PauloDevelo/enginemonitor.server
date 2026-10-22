import winston, { createLogger, format, transports } from 'winston';
import { getLogLevel } from './configResolvers';

export const createAppLogger = (level: string) => createLogger({
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  level,
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
      ),
      level,
    }),
  ],
});

const logLevel = getLogLevel();

winston.level = logLevel;

const logger = createAppLogger(logLevel);

logger.log('info', `process.env.NODE_ENV=${process.env.NODE_ENV}`);

export default logger;
