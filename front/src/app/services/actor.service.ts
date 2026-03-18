import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ActorService {
  private apiUrl = 'http://localhost:5000/api/actors';

  constructor(private http: HttpClient) {}

  getAll(organism_id?: number): Observable<User[]> {
    const url = organism_id ? `${this.apiUrl}?organism_id=${organism_id}` : this.apiUrl;
    return this.http.get<User[]>(url);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.apiUrl}/roles`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  update(id: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  resetPassword(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/reset-password`, {});
  }
}