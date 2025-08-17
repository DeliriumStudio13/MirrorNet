/**
 * Monitoring and error tracking utilities
 * Provides structured logging and metrics collection for production debugging
 * Can be easily extended with external services (Sentry, LogRocket, etc.)
 */

export interface ErrorContext {
  userId?: string;
  action?: string;
  component?: string;
  additionalData?: Record<string, any>;
  timestamp?: Date;
}

export interface MetricData {
  name: string;
  value: number;
  unit?: string;
  tags?: Record<string, string>;
  timestamp?: Date;
}

export interface PerformanceMetric {
  name: string;
  duration: number;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Tracks application errors with context for debugging
 * In production, this would integrate with Sentry, Bugsnag, etc.
 */
export function trackError(error: Error, context: ErrorContext = {}): void {
  const errorData = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    timestamp: context.timestamp || new Date(),
    ...context,
    // Add environment info
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
  };

  // Console logging for development
  console.error('🚨 Application Error:', errorData);

  // In production, send to external service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with Sentry, Bugsnag, or similar service
    // Example: Sentry.captureException(error, { contexts: { custom: context } });
    
    // For now, could send to a custom endpoint or Firebase Function
    sendErrorToService(errorData).catch(err => 
      console.error('Failed to send error to monitoring service:', err)
    );
  }
}

/**
 * Tracks custom metrics and performance data
 * Useful for monitoring business metrics, response times, etc.
 */
export function trackMetric(metric: MetricData): void {
  const metricData = {
    ...metric,
    timestamp: metric.timestamp || new Date(),
    environment: process.env.NODE_ENV || 'development',
  };

  console.log(`📊 Metric: ${metric.name} = ${metric.value}${metric.unit || ''}`, metricData);

  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with DataDog, New Relic, or custom analytics
    sendMetricToService(metricData).catch(err =>
      console.error('Failed to send metric to monitoring service:', err)
    );
  }
}

/**
 * Tracks performance of operations (API calls, database queries, etc.)
 */
export function trackPerformance(metric: PerformanceMetric): void {
  const performanceData = {
    ...metric,
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  };

  console.log(`⚡ Performance: ${metric.name} took ${metric.duration}ms (${metric.success ? 'success' : 'failure'})`);

  // Track slow operations
  if (metric.duration > 5000) { // 5 seconds
    console.warn(`🐌 Slow operation detected: ${metric.name} took ${metric.duration}ms`);
  }

  if (process.env.NODE_ENV === 'production') {
    sendMetricToService({
      name: `performance.${metric.name}`,
      value: metric.duration,
      unit: 'ms',
      tags: {
        success: metric.success.toString(),
        ...metric.metadata,
      },
    }).catch(err =>
      console.error('Failed to send performance metric:', err)
    );
  }
}

/**
 * Higher-order function to automatically track function performance
 * @param name - Name of the operation being tracked
 * @param func - Function to wrap with performance tracking
 * @returns Wrapped function with automatic performance tracking
 */
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  name: string,
  func: T
): T {
  return ((...args: Parameters<T>) => {
    const startTime = performance.now();
    
    try {
      const result = func(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then((value) => {
            trackPerformance({
              name,
              duration: performance.now() - startTime,
              success: true,
            });
            return value;
          })
          .catch((error) => {
            trackPerformance({
              name,
              duration: performance.now() - startTime,
              success: false,
            });
            throw error;
          });
      }
      
      // Handle sync functions
      trackPerformance({
        name,
        duration: performance.now() - startTime,
        success: true,
      });
      
      return result;
    } catch (error) {
      trackPerformance({
        name,
        duration: performance.now() - startTime,
        success: false,
      });
      throw error;
    }
  }) as T;
}

/**
 * Tracks user actions for analytics and debugging
 */
export function trackUserAction(
  action: string,
  userId?: string,
  metadata?: Record<string, any>
): void {
  const actionData = {
    action,
    userId,
    metadata,
    timestamp: new Date(),
    url: typeof window !== 'undefined' ? window.location.pathname : 'server',
  };

  console.log(`👤 User Action: ${action}`, actionData);

  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to analytics service (Google Analytics, Mixpanel, etc.)
    sendAnalyticsEvent(actionData).catch(err =>
      console.error('Failed to send analytics event:', err)
    );
  }
}

/**
 * Tracks critical business events (subscriptions, payments, etc.)
 */
export function trackBusinessEvent(
  event: string,
  data: Record<string, any>
): void {
  const eventData = {
    event,
    ...data,
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  };

  console.log(`💼 Business Event: ${event}`, eventData);

  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to business intelligence platform
    sendBusinessEventToService(eventData).catch(err =>
      console.error('Failed to send business event:', err)
    );
  }
}

/**
 * Utility to safely stringify objects for logging
 */
function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (error) {
    return `[Unstringifiable object: ${error.message}]`;
  }
}

/**
 * Log structured information for debugging
 */
export function logInfo(message: string, data?: any): void {
  console.log(`ℹ️  ${message}`, data ? safeStringify(data) : '');
}

/**
 * Log warnings that need attention but don't break functionality
 */
export function logWarning(message: string, data?: any): void {
  console.warn(`⚠️  ${message}`, data ? safeStringify(data) : '');
}

// Internal functions for sending data to external services
// These would be implemented when integrating with actual monitoring services

async function sendErrorToService(errorData: any): Promise<void> {
  // TODO: Implement actual error reporting service integration
  // Example: await fetch('/api/monitoring/errors', { method: 'POST', body: JSON.stringify(errorData) });
}

async function sendMetricToService(metricData: any): Promise<void> {
  // TODO: Implement actual metrics service integration
  // Example: await fetch('/api/monitoring/metrics', { method: 'POST', body: JSON.stringify(metricData) });
}

async function sendAnalyticsEvent(eventData: any): Promise<void> {
  // TODO: Implement actual analytics service integration
  // Example: gtag('event', eventData.action, { custom_parameter: eventData.metadata });
}

async function sendBusinessEventToService(eventData: any): Promise<void> {
  // TODO: Implement actual business intelligence service integration
  // Example: await mixpanel.track(eventData.event, eventData);
}

/**
 * Health check utility for monitoring system status
 */
export function checkSystemHealth(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: Date;
} {
  const checks = {
    // Add health checks relevant to your app
    firebaseConnection: true, // TODO: Actually check Firebase connection
    stripeConnection: true,   // TODO: Actually check Stripe connection
    memoryUsage: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // 500MB limit
  };

  const failedChecks = Object.values(checks).filter(check => !check).length;
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (failedChecks === 0) {
    status = 'healthy';
  } else if (failedChecks <= 1) {
    status = 'degraded';
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    checks,
    timestamp: new Date(),
  };
}

