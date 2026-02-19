/**
 * Generic logger utility - can be used in any project
 * Provides configurable logging with prefix and debug mode
 */

/**
 * Generic logger class with configurable prefix and debug mode
 */
/**
 * Generic logger class with configurable prefix and debug mode
 */
export class Logger {
  private readonly levelNames = {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  };

  constructor(
    private readonly prefix: string,
    private readonly debug: boolean = false
  ) { }

  private formatError(error: unknown): string {
    if (!error) return '';
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }

  private log(level: 'INFO' | 'WARN' | 'ERROR', message: string, metadata?: Record<string, unknown>, error?: unknown): void {
    if (level === 'ERROR' || this.debug) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${this.prefix}] [${level}]`;

      const logData = {
        message,
        ...metadata,
        ...(error ? { error: this.formatError(error) } : {})
      };

      switch (level) {
        case 'INFO':
          console.log(prefix, logData);
          break;
        case 'WARN':
          console.warn(prefix, logData);
          break;
        case 'ERROR':
          console.error(prefix, logData);
          break;
      }
    }
  }

  /**
   * Log informational message
   */
  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('INFO', message, metadata);
  }

  /**
   * Log error message
   */
  error(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    this.log('ERROR', message, metadata, error);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('WARN', message, metadata);
  }
}
