import winston from 'winston';

const logger = winston.createLogger({
  level: 'info', 
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(), // Muestra los logs en consola
    new winston.transports.File({ filename: 'logs/app.log' }), // Guarda los logs en un archivo
  ],
});

export default logger;
