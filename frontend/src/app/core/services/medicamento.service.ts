import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { MedicamentoHoy } from '../../features/adulto/models/adulto.models';

@Injectable({ providedIn: 'root' })
export class MedicamentoService {
  private readonly http = inject(HttpClient);
  obtenerMedicamentosHoy(pacienteId: string) { return this.http.get<ApiResponse<MedicamentoHoy[]>>(`${environment.apiUrl}/medicamentos/paciente/${pacienteId}/hoy`); }
}
