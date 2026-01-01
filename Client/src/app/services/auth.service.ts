import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { tap } from 'rxjs';
import { TokenService } from './token.service';
import { CommonService } from './common.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private envUrl = environment.apiUrl;
  private API = `${this.envUrl}/auth`;
  private http = inject(HttpClient);
  private tokenService = inject(TokenService);
  private commonService = inject(CommonService);

  private user = signal<any>(
    localStorage.getItem('access_token')
      ? jwtDecode(localStorage.getItem('access_token')!)
      : null
  );
  currentUser = this.user.asReadonly();

  private tokenResponse(data: any) {
    // Backend returns { status, token }
    const token = data.token || data;
    if (!token) {
      console.error('No token received in response:', data);
      return;
    }
    this.tokenService.setAccessToken(token);
    const jwtDetails: any = jwtDecode(token);
    this.user.set(jwtDetails);
    console.log('Token stored successfully');
  }

  login(credentials: { email: string; password: string }) {
    return this.commonService
      .post(`${this.API}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (data: any) => {
            this.tokenResponse(data);
          },
        })
      );
  }

  registerTeacher(data: any) {
    return this.commonService.post(`${this.API}/register/teacher`, data, {
      withCredentials: true,
    });
  }

  registerStudent(data: any) {
    return this.commonService.post(`${this.API}/register/student`, data, {
      withCredentials: true,
    });
  }

  logout() {
    return this.commonService
      .post(`${this.API}/logout`, null, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: () => {
            this.tokenService.clear();
            this.user.set(null);
          },
        })
      );
  }

  refreshAccessToken() {
    return this.commonService
      .post(`${this.API}/refresh-access-token`, null, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (data: any) => {
            this.tokenResponse(data);
          },
        })
      );
  }
}

