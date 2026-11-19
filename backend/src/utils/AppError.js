export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }
}
