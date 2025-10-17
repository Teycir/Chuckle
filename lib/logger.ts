/**
 * Generic logger utility - can be used in any project
 * Provides configurable logging with prefix and debug mode
 */

/**
 * Generic logger class with configurable prefix and debug mode
 */
export class Logger {
  constructor(
    private prefix: string,
    private debug: boolean = false
  ) {}
  
  /**
   * Log informational message (only in debug mode)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.debug) console.log(`[${this.prefix}] ${message}`, ...args);
  }
  
  /**
   * Log error message (always shown)
   */
  error(message: string, error?: unknown): void {
    console.error(`[${this.prefix} Error] ${message}`, error);
  }
  
  /**
   * Log warning message (only in debug mode)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.debug) console.warn(`[${this.prefix} Warning] ${message}`, ...args);
  }
}
