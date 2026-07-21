import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  obtenerInicioAdulto(pacienteId: string) { return this.http.get<ApiResponse<unknown>>(`${environment.apiUrl}/pacientes/${pacienteId}/resumen-adulto`); }
}
