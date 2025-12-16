import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { ProgressService } from './progress.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // We still keep currentUser for UI "Welcome" message, but real auth is the token
    private currentUserSubject = new BehaviorSubject<string | null>(localStorage.getItem('currentUser'));
    public currentUser$ = this.currentUserSubject.asObservable();

    private http = inject(HttpClient);
    private router = inject(Router);
    private progressService = inject(ProgressService);

    login(username: string, password?: string): void {
        const loginPayload = { username, password };

        this.http.post<{ token: string, userId: string }>(`${environment.apiUrl}/Login`, loginPayload)
            .subscribe({
                next: (response) => {
                    // Store token securely
                    localStorage.setItem('authToken', response.token);

                    // Store userId as requested
                    localStorage.setItem('userId', response.userId);

                    // Store username for UI display
                    localStorage.setItem('currentUser', username);
                    this.currentUserSubject.next(username);

                    // Clear cached start date info to force fresh API call after login
                    this.progressService.refreshStartDateInfo();

                    this.router.navigate(['/']);
                },
                error: (err) => {
                    console.error('Login failed', err);
                    alert('Login failed. Please check your credentials.');
                }
            });
    }

    logout(): void {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userId');
        this.currentUserSubject.next(null);

        // Clear cached start date info on logout
        this.progressService.refreshStartDateInfo();

        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('authToken');
    }

    getCurrentUser(): string | null {
        return this.currentUserSubject.value;
    }
}
