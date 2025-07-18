const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

let prisma;

const getPrismaClient = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query', (e) => {
        logger.debug(`Query: ${e.query} - Params: ${e.params} - Duration: ${e.duration}ms`);
      });
    }

    prisma.$on('error', (e) => {
      logger.error('Prisma error:', e);
    });

    prisma.$on('warn', (e) => {
      logger.warn('Prisma warning:', e);
    });

    prisma.$on('info', (e) => {
      logger.info('Prisma info:', e);
    });
  }
  
  return prisma;
};

const connectDB = async () => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('Database connected successfully via Prisma');
    return client;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
};

const disconnectDB = async () => {
  try {
    if (prisma) {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from database:', error);
    throw error;
  }
};

module.exports = {
  getPrismaClient,
  connectDB,
  disconnectDB
};
