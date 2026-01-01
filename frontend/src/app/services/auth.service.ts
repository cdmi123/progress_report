import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private api: ApiService) {
        const user = localStorage.getItem('currentUser');
        if (user) {
            this.currentUserSubject.next(JSON.parse(user));
        }
    }

    login(credentials: any, role: 'admin' | 'student'): Observable<any> {
        const endpoint = role === 'admin' ? 'auth/admin/login' : 'auth/student/login';
        return this.api.post(endpoint, credentials).pipe(
            tap(response => {
                if (response.success) {
                    const userData = { ...response.data, roleType: role };
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    this.currentUserSubject.next(userData);
                }
            })
        );
    }

    logout(): void {
        const user = this.currentUserSubject.value;
        const endpoint = user?.roleType === 'admin' ? 'auth/admin/logout' : 'auth/student/logout';
        this.api.get(endpoint).subscribe(() => {
            localStorage.removeItem('currentUser');
            this.currentUserSubject.next(null);
        });
    }

    isLoggedIn(): boolean {
        return !!this.currentUserSubject.value;
    }

    getRole(): string | null {
        return this.currentUserSubject.value?.roleType || null;
    }
}
