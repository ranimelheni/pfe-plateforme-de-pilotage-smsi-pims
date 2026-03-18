import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FicheProcessusService {
  private api = 'http://localhost:5000/api/fiches';

  constructor(private http: HttpClient) {}

  getMine():                                  Observable<any>   { return this.http.get(`${this.api}/mine`); }
  getById(id: number):                        Observable<any>   { return this.http.get(`${this.api}/${id}`); }
  getByOrganism(orgId: number):               Observable<any[]> { return this.http.get<any[]>(`${this.api}/organism/${orgId}`); }
  update(id: number, data: any):              Observable<any>   { return this.http.put(`${this.api}/${id}`, data); }
  updateDpo(id: number, data: any):           Observable<any>   { return this.http.put(`${this.api}/${id}/dpo`, data); }
  updateStatut(id: number, statut: string, commentaire?: string): Observable<any> {
    return this.http.put(`${this.api}/${id}/statut`, { statut, commentaire });
  }
}