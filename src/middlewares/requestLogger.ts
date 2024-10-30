import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import chalk from 'chalk'; // For colorful console output

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const { method, originalUrl } = req;
        const { statusCode } = res;

        let statusColor = chalk.green;
        if (statusCode >= 400) statusColor = chalk.yellow;
        if (statusCode >= 500) statusColor = chalk.red;

        console.log(
            `${chalk.blue(method)} ${chalk.cyan(originalUrl)} ${statusColor(statusCode)} ${chalk.gray(`${duration}ms`)}`
        );

        // Log headers
        // console.log(chalk.magenta('Headers:'), req.headers);

        // Log query parameters
        if (Object.keys(req.query).length > 0) {
            console.log(chalk.magenta('Query:'), req.query);
        }

        // Log body for POST, PUT, PATCH requests
        if (['POST', 'PUT', 'PATCH'].includes(method) && req.body) {
            console.log(chalk.magenta('Body:'), req.body);
        }

        console.log('---');  // Separator for readability
    });
    logger.info(`${req.method} ${req.path}`);
    // logger.info('Headers:', req.headers);
    next();
};