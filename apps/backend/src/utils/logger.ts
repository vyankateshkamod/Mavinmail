import pino from 'pino';

/**
 * Structured logger for the Mavinmail API.
 *
 * Creates a pino-backed logger that accepts both:
 *   - Pino-native:   logger.info({ userId, model }, 'Summarizing email')
 *   - Console-style: logger.info('Message', data1, data2)
 *
 * In production → structured JSON lines.
 * In development → colorized pretty output via pino-pretty.
 */
const baseLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
        process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
    base: { service: 'mavinmail-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: ['req.headers.authorization', 'apiKey', 'accessToken', 'refreshToken'],
});

/**
 * Creates a log method that accepts both console-style and pino-native arguments.
 *
 * Pattern mapping:
 *   logger.info('msg')                       → pino.info('msg')
 *   logger.info({ key: val }, 'msg')         → pino.info({ key: val }, 'msg')
 *   logger.info('prefix', data)              → pino.info({ data }, 'prefix')
 *   logger.info('prefix', err)               → pino.info({ err }, 'prefix')
 *   logger.info('a', 'b', 'c')              → pino.info('a b c')
 */
function createLogMethod(level: pino.Level) {
    return (...args: unknown[]): void => {
        if (args.length === 0) return;

        // Single argument — just a message or object
        if (args.length === 1) {
            if (typeof args[0] === 'string') {
                baseLogger[level](args[0]);
            } else {
                baseLogger[level](args[0] as object);
            }
            return;
        }

        // First arg is a non-null object (not Error) → pino-native style
        if (
            typeof args[0] === 'object' &&
            args[0] !== null &&
            !(args[0] instanceof Error)
        ) {
            baseLogger[level](args[0] as object, String(args[1] ?? ''), ...(args.slice(2) as string[]));
            return;
        }

        // Console-style: logger.info('message', data1, data2, ...)
        const msg = String(args[0]);
        const rest = args.slice(1);

        if (rest.length === 1) {
            const val = rest[0];
            if (val instanceof Error) {
                baseLogger[level]({ err: val }, msg);
            } else if (typeof val === 'object' && val !== null) {
                baseLogger[level](val as object, msg);
            } else {
                // primitive value — append to message
                baseLogger[level](`${msg} ${String(val)}`);
            }
        } else {
            // Multiple extra args — bundle into data array
            baseLogger[level]({ data: rest }, msg);
        }
    };
}

/**
 * Application logger.
 *
 * Drop-in replacement for console.log/error/warn with structured output.
 * Also exposes the raw pino instance for advanced use cases.
 */
const logger = {
    info: createLogMethod('info'),
    error: createLogMethod('error'),
    warn: createLogMethod('warn'),
    debug: createLogMethod('debug'),
    trace: createLogMethod('trace'),
    fatal: createLogMethod('fatal'),
    /** Raw pino instance for middlewares that need it (e.g. pino-http) */
    pino: baseLogger,
};

export default logger;
