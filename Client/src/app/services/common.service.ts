import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { handleHttpError } from '../utils/handle-httpError.utils';

@Injectable({ providedIn: 'root' })
export class CommonService {
  private http = inject(HttpClient);

  get<T>(url: string) {
    return this.http.get<T>(url).pipe(handleHttpError());
  }

  post<T>(url: string, payload: any, options?: any) {
    return this.http.post<T>(url, payload, options).pipe(handleHttpError());
  }

  put<T>(url: string, payload: any) {
    return this.http.put<T>(url, payload).pipe(handleHttpError());
  }

  delete<T>(url: string) {
    return this.http.delete<T>(url).pipe(handleHttpError());
  }
}

