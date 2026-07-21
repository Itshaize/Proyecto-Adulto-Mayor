import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Paciente, ResumenAdmin } from '../models/domain.models';

export interface ResumenAdulto { nombreHijo?: string; telefonoHijo?: string; estadoGeneral?: 'NORMAL' | 'REVISAR' | 'ALERTA'; paciente?: Pick<Paciente, '_id' | 'nombre' | 'edad'>; }

@Injectable({ providedIn: 'root' })
export class PacienteService {
  constructor(private readonly http: HttpClient) {}
  getPaciente(id: string) { return this.http.get<ApiResponse<Paciente>>(`${environment.apiUrl}/pacientes/${id}`); }
  getResumenPaciente(id: string) { return this.http.get<ApiResponse<ResumenAdmin>>(`${environment.apiUrl}/pacientes/${id}/resumen`); }
  getResumenAdulto(id: string) { return this.http.get<ApiResponse<ResumenAdulto>>(`${environment.apiUrl}/pacientes/${id}/resumen-adulto`); }
  createPaciente(body: Partial<Paciente>) { return this.http.post<ApiResponse<Paciente>>(`${environment.apiUrl}/pacientes`, body); }
  updatePaciente(id: string, body: Partial<Paciente>) { return this.http.put<ApiResponse<Paciente>>(`${environment.apiUrl}/pacientes/${id}`, body); }
}
