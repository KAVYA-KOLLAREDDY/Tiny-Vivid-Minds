import { catchError, MonoTypeOperatorFunction, throwError } from 'rxjs';

export function handleHttpError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((err) => {
    const message = err?.error?.message || 'Unknown internal server error!';
    return throwError(() => new Error(message));
  });
}

