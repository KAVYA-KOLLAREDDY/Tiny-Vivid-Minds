import { catchError, MonoTypeOperatorFunction, throwError } from 'rxjs';

export function handleHttpError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((err) => {
    console.error('🚨 HttpError: HTTP error occurred:', err);
    const message = err?.error?.message || 'Unknown internal server error!';
    console.error('🚨 HttpError: Error message:', message);
    return throwError(() => new Error(message));
  });
}

