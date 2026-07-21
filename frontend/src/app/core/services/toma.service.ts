import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { MedicamentoHoy } from '../../features/adulto/models/adulto.models';

@Injectable({ providedIn: 'root' })
export class TomaService {
  private readonly http = inject(HttpClient);
  obtenerTomasHoy(pacienteId: string) { return this.http.get<ApiResponse<MedicamentoHoy[]>>(`${environment.apiUrl}/tomas/paciente/${pacienteId}/hoy`); }
  obtenerHistorial(pacienteId: string, dias = 7) { return this.http.get<ApiResponse<unknown[]>>(`${environment.apiUrl}/tomas/paciente/${pacienteId}`, { params: { dias } }); }
  confirmarToma(tomaId: string) { return this.http.patch<ApiResponse<unknown>>(`${environment.apiUrl}/tomas/${tomaId}/confirmar`, { metodoConfirmacion: 'APP' }); }
}
