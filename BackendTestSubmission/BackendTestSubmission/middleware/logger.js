const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: this.getTimestamp(),
      level: level.toUpperCase(),
      message,
      meta,
      service: 'url-shortener-microservice'
    });
  }

  writeLog(level, message, meta = {}) {
    const logMessage = this.formatMessage(level, message, meta);
    const logFile = path.join(this.logDir, `${level}.log`);
    const allLogsFile = path.join(this.logDir, 'all.log');
    
    // Write to specific level file
    fs.appendFileSync(logFile, logMessage + '\n');
    // Write to all logs file
    fs.appendFileSync(allLogsFile, logMessage + '\n');
    
    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(logMessage);
    }
  }

  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }

  error(message, meta = {}) {
    this.writeLog('error', message, meta);
  }

  debug(message, meta = {}) {
    this.writeLog('debug', message, meta);
  }

  // Express middleware
  middleware(req, res, next) {
    const start = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // Override res.send to capture response
    res.send = function(body) {
      res.responseBody = body;
      return originalSend.call(this, body);
    };

    res.json = function(body) {
      res.responseBody = JSON.stringify(body);
      return originalJson.call(this, body);
    };

    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip || req.connection.remoteAddress,
        referer: req.get('Referer')
      };

      if (res.statusCode >= 400) {
        logger.error(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
      } else {
        logger.info(`HTTP ${res.statusCode} - ${req.method} ${req.originalUrl}`, logData);
      }
    });

    next();
  }
}

const logger = new Logger();
module.exports = logger;