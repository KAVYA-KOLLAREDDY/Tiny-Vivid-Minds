import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { handleHttpError } from '../utils/handle-httpError.utils';

@Injectable({ providedIn: 'root' })
export class CommonService {
  private http = inject(HttpClient);

  get<T>(url: string) {
    console.log('🌐 CommonService: GET request to:', url);
    return this.http.get<T>(url).pipe(handleHttpError());
  }

  post<T>(url: string, payload: any, options?: any) {
    console.log('🌐 CommonService: POST request to:', url, 'with payload:', payload);
    return this.http.post<T>(url, payload, options).pipe(handleHttpError());
  }

  put<T>(url: string, payload: any) {
    console.log('🌐 CommonService: PUT request to:', url, 'with payload:', payload);
    return this.http.put<T>(url, payload).pipe(handleHttpError());
  }

  delete<T>(url: string) {
    console.log('🌐 CommonService: DELETE request to:', url);
    return this.http.delete<T>(url).pipe(handleHttpError());
  }
}

