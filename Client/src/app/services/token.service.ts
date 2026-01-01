import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class TokenService {
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setAccessToken(token: string) {
    localStorage.setItem('access_token', token);
  }

  clear(): void {
    localStorage.removeItem('access_token');
  }

  isAccessTokenExpired(bufferInSeconds: number = 10): boolean {
    if (!this.getAccessToken()) {
      return true;
    }
    const payload: any = jwtDecode(this.getAccessToken()!);
    const now = Math.floor(Date.now() / 1000);
    return payload.exp - bufferInSeconds <= now;
  }
}

