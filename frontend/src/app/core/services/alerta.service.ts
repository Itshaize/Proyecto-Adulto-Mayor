import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Alerta } from '../models/domain.models';
@Injectable({ providedIn: 'root' }) export class AlertaService { constructor(private readonly http: HttpClient) {} getByPaciente(id: string, soloNoLeidas = false) { return this.http.get<ApiResponse<Alerta[]>>(`${environment.apiUrl}/alertas/paciente/${id}`, { params: { soloNoLeidas } }); } marcarLeida(id: string) { return this.http.patch<ApiResponse<Alerta>>(`${environment.apiUrl}/alertas/${id}/leida`, {}); } }
