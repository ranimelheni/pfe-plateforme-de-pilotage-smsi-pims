import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Organism } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrganismService {
  private apiUrl = 'http://localhost:5000/api/organisms';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Organism[]> {
    return this.http.get<Organism[]>(this.apiUrl);
  }

  getById(id: number): Observable<Organism> {
    return this.http.get<Organism>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Organism>): Observable<Organism> {
    return this.http.post<Organism>(this.apiUrl, data);
  }

  update(id: number, data: Partial<Organism>): Observable<Organism> {
    return this.http.put<Organism>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}