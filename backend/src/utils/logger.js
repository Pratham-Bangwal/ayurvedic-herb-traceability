// backend/src/utils/logger.js
const pino = require('pino');
const { isMock } = require('../services/mode');

const level = process.env.LOG_LEVEL || 'info';

const logger = pino({
  level,
  base: { mockMode: isMock() },
  transport: process.env.NODE_ENV === 'production' ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' }
  }
});

module.exports = logger;
