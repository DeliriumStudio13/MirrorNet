/**
 * Debounce utility to limit function execution frequency
 * Crucial for reducing Firestore costs by batching rapid listener updates
 */

interface DebounceOptions {
  leading?: boolean;  // Execute on the leading edge
  trailing?: boolean; // Execute on the trailing edge (default: true)
}

/**
 * Creates a debounced function that delays execution until after delay milliseconds
 * have elapsed since the last time the debounced function was invoked
 * 
 * @param func - The function to debounce
 * @param delay - The number of milliseconds to delay
 * @param options - Configuration options
 * @returns A debounced version of the function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: DebounceOptions = { trailing: true }
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any = null;
  let result: ReturnType<T>;
  let hasInvoked = false;

  const { leading = false, trailing = true } = options;

  function invokeFunc() {
    if (lastArgs) {
      result = func.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
      hasInvoked = true;
    }
    return result;
  }

  function leadingEdge() {
    // Reset any pending trailing edge call
    hasInvoked = false;
    // Start timer for trailing edge
    timeoutId = setTimeout(timerExpired, delay);
    // Invoke immediately if leading edge is enabled
    return leading ? invokeFunc() : result;
  }

  function timerExpired() {
    timeoutId = null;
    // Invoke only if trailing edge is enabled and the function was called during the delay
    if (trailing && !hasInvoked) {
      return invokeFunc();
    }
    // Reset for next cycle
    hasInvoked = false;
    return result;
  }

  const debounced = function (this: any, ...args: Parameters<T>): ReturnType<T> {
    lastArgs = args;
    lastThis = this;

    if (timeoutId === null) {
      return leadingEdge();
    } else {
      // Reset the timer
      clearTimeout(timeoutId);
      timeoutId = setTimeout(timerExpired, delay);
    }
    return result;
  } as T & { cancel: () => void; flush: () => void };

  debounced.cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    hasInvoked = false;
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
      return invokeFunc();
    }
    return result;
  };

  return debounced;
}

/**
 * Creates a throttled function that only invokes func at most once per every delay milliseconds
 * 
 * @param func - The function to throttle
 * @param delay - The number of milliseconds to throttle invocations to
 * @returns A throttled version of the function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cancel: () => void; flush: () => void } {
  return debounce(func, delay, { leading: true, trailing: false });
}

