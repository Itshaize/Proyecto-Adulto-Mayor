import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Toma } from '../models/domain.models';
@Injectable({ providedIn: 'root' }) export class TomaService { constructor(private readonly http: HttpClient) {} getByPaciente(id: string, dias?: number) { return this.http.get<ApiResponse<Toma[]>>(`${environment.apiUrl}/tomas/paciente/${id}`, dias ? { params: { dias } } : {}); } getHoy(id: string) { return this.http.get<ApiResponse<Toma[]>>(`${environment.apiUrl}/tomas/paciente/${id}/hoy`); } confirmarToma(id: string) { return this.http.patch<ApiResponse<Toma>>(`${environment.apiUrl}/tomas/${id}/confirmar`, { metodoConfirmacion: 'APP' }); } }
