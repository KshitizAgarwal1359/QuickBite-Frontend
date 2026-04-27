import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, RegisterRequest, UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly baseUrl = environment.apiUrls.auth;
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.currentUserSubject.asObservable().pipe(
    map(user => !!user && !this.checkExpiry())
  );

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  checkExpiry(): boolean {
    const expiresAt = sessionStorage.getItem('qb_expires_at');
    if (!expiresAt) return false;
    const isExpired = new Date(expiresAt).getTime() < new Date().getTime();
    if (isExpired) {
      this.clearAuth();
      return true;
    }
    return false;
  }

  private loadStoredUser(): void {
    if (this.checkExpiry()) {
      return;
    }
    const stored = sessionStorage.getItem('qb_user');
    if (stored) this.currentUserSubject.next(JSON.parse(stored));
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap(res => this.storeAuth(res))
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/logout`, {}).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/login']);
      })
    );
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}/profile`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.baseUrl}/profile`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.put(`${this.baseUrl}/password`, request);
  }

  deactivateAccount(): Observable<any> {
    return this.http.delete(`${this.baseUrl}/deactivate`);
  }

  private storeAuth(res: AuthResponse): void {
    sessionStorage.setItem('qb_token', res.token);
    sessionStorage.setItem('qb_expires_at', res.expiresAt);
    sessionStorage.setItem('qb_user', JSON.stringify(res.user));
    this.currentUserSubject.next(res.user);
  }

  clearAuth(): void {
    sessionStorage.removeItem('qb_token');
    sessionStorage.removeItem('qb_expires_at');
    sessionStorage.removeItem('qb_user');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null { return sessionStorage.getItem('qb_token'); }
  isLoggedIn(): boolean { 
    if (this.checkExpiry()) return false;
    return !!this.getToken(); 
  }
  getCurrentUser(): UserProfile | null { return this.currentUserSubject.value; }
  getUserRole(): string { return this.getCurrentUser()?.role || ''; }
  getUserId(): number { return this.getCurrentUser()?.userId || 0; }
}
