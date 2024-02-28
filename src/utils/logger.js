import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf } = format;

// Custom log format
const logFormat = printf(({ level, message, timestamp }) => {
  return `[${timestamp}] ${level}: ${message}`;
});

// Create a Winston logger instance
const logger = createLogger({
  format: combine(timestamp(), logFormat),
  transports: [
    new DailyRotateFile({
      filename: "logs/application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

export default logger;
