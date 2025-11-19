/**
 * Network utilities for handling retries, timeouts, and error recovery
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface TimeoutOptions {
  timeoutMs?: number;
  timeoutMessage?: string;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Default timeout configuration
 */
const DEFAULT_TIMEOUT_OPTIONS: Required<TimeoutOptions> = {
  timeoutMs: 15000,
  timeoutMessage: 'Operation timed out',
};

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.baseDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  // Network-related errors
  if (errorMessage.includes('network') || 
      errorMessage.includes('fetch') || 
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection') ||
      errorCode === 'network_error' ||
      errorCode === 'timeout') {
    return true;
  }
  
  // HTTP status codes that are retryable
  if (error.status >= 500 || error.status === 429) {
    return true;
  }
  
  // Supabase specific retryable errors
  if (errorCode === 'PGRST301' || // Permission denied (might be temporary)
      errorCode === 'PGRST116') { // No rows returned (might be race condition)
    return true;
  }
  
  return false;
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === config.maxRetries) {
        break;
      }
      
      // Only retry if error is retryable
      if (!isRetryableError(error)) {
        break;
      }
      
      const delay = calculateRetryDelay(attempt, config);
      console.warn(`Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms:`, error);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Execute a function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  options: TimeoutOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_TIMEOUT_OPTIONS, ...options };
  
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(config.timeoutMessage));
      }, config.timeoutMs);
    })
  ]);
}

/**
 * Execute a function with both retry and timeout
 */
export async function withRetryAndTimeout<T>(
  fn: () => Promise<T>,
  retryOptions: RetryOptions = {},
  timeoutOptions: TimeoutOptions = {}
): Promise<T> {
  return withRetry(
    () => withTimeout(fn, timeoutOptions),
    retryOptions
  );
}

/**
 * Safe async operation that never throws
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorHandler?: (error: any) => void
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Safe async operation failed:', error);
    }
    return fallback;
  }
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
