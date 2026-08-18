import { Logger as WinstonLogger, createLogger, format, transports } from 'winston';

type LogLevel = 'silly' | 'debug' | 'verbose' | 'info' | 'warn' | 'error';

const supportedLogLevels = new Set<LogLevel>(['silly', 'debug', 'verbose', 'info', 'warn', 'error']);
const configuredLogLevel = (process.env.LOG_LEVEL || 'info').trim().toLowerCase();
const loggingDisabled = configuredLogLevel === 'off';
const logLevel = supportedLogLevels.has(configuredLogLevel as LogLevel) ? configuredLogLevel : 'info';
const jsonOutput = process.env.JSON_PRINT?.trim().toLowerCase() === 'true';

const outputFormat = jsonOutput
  ? format.combine(format.timestamp(), format.json())
  : format.combine(
      format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZ' }),
      format.printf(({ timestamp, level, label, message }) => `${timestamp} - ${level}: [${label}] ${String(message)}`)
    );

const rootLogger = createLogger({
  level: logLevel,
  silent: loggingDisabled,
  format: outputFormat,
  transports: [
    new transports.Console({
      stderrLevels: ['error', 'debug'],
    }),
  ],
});

const loggerCache = new Map<string, ApplicationLogger>();

class ApplicationLogger {
  public constructor(private readonly delegate: WinstonLogger) {}

  public silly(...args: unknown[]): void {
    this.write('silly', args);
  }

  public debug(...args: unknown[]): void {
    this.write('debug', args);
  }

  public verbose(...args: unknown[]): void {
    this.write('verbose', args);
  }

  public info(...args: unknown[]): void {
    this.write('info', args);
  }

  public warn(...args: unknown[]): void {
    this.write('warn', args);
  }

  public error(...args: unknown[]): void {
    this.write('error', args);
  }

  private write(level: LogLevel, args: unknown[]): void {
    this.delegate.log(level, formatLogMessage(args));
  }
}

export class Logger {
  public static getLogger(name: string): ApplicationLogger {
    const existingLogger = loggerCache.get(name);
    if (existingLogger) {
      return existingLogger;
    }

    const logger = new ApplicationLogger(
      rootLogger.child({
        label: name,
        loggerName: name,
      })
    );
    loggerCache.set(name, logger);
    return logger;
  }
}

function formatLogMessage(args: unknown[]): string {
  return args.map(argument => formatValue(argument, new WeakSet<object>())).join(' ');
}

function formatValue(value: unknown, seen: WeakSet<object>): string {
  if (value instanceof Error) {
    return value.stack || `${value.name}: ${value.message}`;
  }

  if (value === null || value === undefined || typeof value !== 'object') {
    return String(value);
  }

  if (seen.has(value)) {
    return '[Circular]';
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return `[${value.map(item => formatValue(item, seen)).join(', ')}]`;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return Object.entries(value)
    .map(([key, item]) => `${key}=${formatValue(item, seen)}`)
    .join(', ');
}
