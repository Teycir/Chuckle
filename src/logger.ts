const DEBUG = false; // Set to true for production debugging

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (DEBUG) console.log(`[Chuckle] ${message}`, ...args);
  },
  
  error: (message: string, error?: unknown) => {
    console.error(`[Chuckle Error] ${message}`, error);
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (DEBUG) console.warn(`[Chuckle Warning] ${message}`, ...args);
  }
};
