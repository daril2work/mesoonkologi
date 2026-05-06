/**
 * MESO App — Structured Logger Utility
 * Prepared for Sentry/Datadog integration.
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

interface LogContext {
  userId?: string
  feature?: string
  [key: string]: unknown
}

class Logger {
  private isDev = import.meta.env.DEV

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${level}] ${message} ${context ? JSON.stringify(context) : ''}`
  }

  public info(message: string, context?: LogContext) {
    const formatted = this.formatMessage('INFO', message, context)
    if (this.isDev) console.info(formatted)
    // Future: send to Sentry/Logging service
  }

  public warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage('WARN', message, context)
    console.warn(formatted)
    // Future: Sentry.captureMessage(message, { level: 'warning', extra: context })
  }

  public error(message: string, error?: Error | unknown, context?: LogContext) {
    const formatted = this.formatMessage('ERROR', message, context)
    console.error(formatted, error)
    // Future: Sentry.captureException(error || new Error(message), { extra: context })
  }

  public debug(message: string, context?: LogContext) {
    if (this.isDev) {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }
}

export const logger = new Logger()
