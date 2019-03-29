import winston, { createLogger, format, transports } from "winston";
import config, {isProd} from "./configUtils";

winston.level = config.get("LogLevel");

const logger = createLogger({
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  level: "debug",
  transports: [
    new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        ),
        level: "debug",
      })
  ]
});

logger.log("info", "process.env.NODE_ENV=" + process.env.NODE_ENV);

export default logger;
