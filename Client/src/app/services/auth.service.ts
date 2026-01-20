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
    console.log('🔐 AuthService: tokenResponse called with data:', data);
    // Backend returns { status, token }
    const token = data.token || data;
    if (!token) {
      console.error('❌ AuthService: No token received in response:', data);
      return;
    }
    console.log('✅ AuthService: Token found, storing it');
    this.tokenService.setAccessToken(token);
    const jwtDetails: any = jwtDecode(token);
    console.log('🔐 AuthService: JWT details decoded:', jwtDetails);
    this.user.set(jwtDetails);
    console.log('✅ AuthService: Token stored successfully');
  }

  login(credentials: { email: string; password: string }) {
    console.log('🔐 AuthService: login called with credentials:', { email: credentials.email, password: '***' });
    return this.commonService
      .post(`${this.API}/login`, credentials, {
        withCredentials: true,
      })
      .pipe(
        tap({
          next: (data: any) => {
            console.log('✅ AuthService: Login API response received:', data);
            this.tokenResponse(data);
          },
          error: (error) => {
            console.error('❌ AuthService: Login API error:', error);
          }
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

