import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Medicion } from '../models/domain.models';
@Injectable({ providedIn: 'root' }) export class MedicionService { constructor(private readonly http: HttpClient) {} getByPaciente(id: string, dias?: number) { return this.http.get<ApiResponse<Medicion[]>>(`${environment.apiUrl}/mediciones/paciente/${id}`, dias ? { params: { dias } } : {}); } getUltima(id: string) { return this.http.get<ApiResponse<Medicion>>(`${environment.apiUrl}/mediciones/paciente/${id}/ultima`); } }
