import { LoggingService } from '../services/logging.service';

export function handleResponse<T>(
  loggingService: LoggingService,
  onSuccess: (response: T) => void,
  finallyFn?: () => void
) {
  return {
    next: (response: T) => {
      onSuccess(response);
      finallyFn?.();
    },
    error: (error: string) => {
      loggingService.onError(error);
      finallyFn?.();
    },
  };
}

