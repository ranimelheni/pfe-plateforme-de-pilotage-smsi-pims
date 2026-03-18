import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.api}/login`, { email, password }).pipe(
      tap((res: any) => {
        // Fusionner must_change_password dans l'objet user avant stockage
        const user = {
          ...res.user,
          must_change_password: res.must_change_password ?? res.user?.must_change_password ?? false
        };
        localStorage.setItem('access_token',  res.access_token);
        localStorage.setItem('refresh_token', res.refresh_token);
        localStorage.setItem('user',          JSON.stringify(user));
      })
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.api}/change-password`, {
      old_password: oldPassword,
      new_password: newPassword
    });
  }

  getToken():       string | null { return localStorage.getItem('access_token'); }
  getCurrentUser(): any           { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
  isLoggedIn():     boolean       { return !!this.getToken(); }

  mustChangePassword(): boolean {
    return this.getCurrentUser()?.must_change_password === true;
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  redirectAfterLogin(user: any): void {
    if (user?.must_change_password) {
      this.router.navigate(['/change-password']);
      return;
    }
    const routeMap: Record<string, string> = {
      super_admin: '/dashboard/organisms',
      rssi:        '/dashboard/clause4',
      pilote_processus: '/dashboard/processus',
    };
    this.router.navigate([routeMap[user?.role] || '/dashboard/organisms']);
  }
}