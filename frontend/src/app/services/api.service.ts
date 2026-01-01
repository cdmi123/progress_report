import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private baseUrl = 'http://localhost:3000/api/v1';

    constructor(private http: HttpClient) { }

    get(endpoint: string, params?: any): Observable<any> {
        return this.http.get(`${this.baseUrl}/${endpoint}`, { params, withCredentials: true });
    }

    post(endpoint: string, data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/${endpoint}`, data, { withCredentials: true });
    }

    put(endpoint: string, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/${endpoint}`, data, { withCredentials: true });
    }

    delete(endpoint: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/${endpoint}`, { withCredentials: true });
    }

    patch(endpoint: string, data: any): Observable<any> {
        return this.http.patch(`${this.baseUrl}/${endpoint}`, data, { withCredentials: true });
    }
}
