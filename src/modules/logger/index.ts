/**
 * Simple logger utility for the plugin
 */
export const logger = {
  /**
   * Log an informational message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  log: (message: string, ...optionalParams: any[]) => {
    console.log(`[INFO] ${message}`, ...optionalParams);
  },
  
  /**
   * Log a warning message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  warn: (message: string, ...optionalParams: any[]) => {
    console.warn(`[WARN] ${message}`, ...optionalParams);
  },
  
  /**
   * Log an error message
   * @param message The message to log
   * @param optionalParams Additional parameters to log
   */
  error: (message: string, ...optionalParams: any[]) => {
    console.error(`[ERROR] ${message}`, ...optionalParams);
  }
}; 