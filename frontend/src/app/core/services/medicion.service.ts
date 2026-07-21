import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Medicion } from '../../features/adulto/models/adulto.models';

@Injectable({ providedIn: 'root' })
export class MedicionService {
  private readonly http = inject(HttpClient);
  obtenerSaludActual(pacienteId: string) { return this.http.get<ApiResponse<Medicion>>(`${environment.apiUrl}/mediciones/paciente/${pacienteId}/ultima`); }
  obtenerHistorialSalud(pacienteId: string, dias: number) { return this.http.get<ApiResponse<Medicion[]>>(`${environment.apiUrl}/mediciones/paciente/${pacienteId}`, { params: { dias } }); }
}
