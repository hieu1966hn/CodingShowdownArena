export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR'
}

type LogContext = Record<string, any>;

class Logger {
    private formatMessage(level: LogLevel, action: string, message: string, context?: LogContext, error?: any) {
        return JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            action,
            message,
            context,
            error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error
        });
    }

    info(action: string, message: string, context?: LogContext) {
        console.info(this.formatMessage(LogLevel.INFO, action, message, context));
    }

    warn(action: string, message: string, context?: LogContext) {
        console.warn(this.formatMessage(LogLevel.WARN, action, message, context));
    }

    error(action: string, error: any, context?: LogContext) {
        console.error(this.formatMessage(LogLevel.ERROR, action, error?.message || 'Unknown error', context, error));
    }
}

export const logger = new Logger();
