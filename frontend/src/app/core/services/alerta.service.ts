import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AlertaPaciente {
  _id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  nivel: string;
  leida: boolean;
  fechaHora: string;
}

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly http = inject(HttpClient);

  obtenerAlertasPaciente(pacienteId: string, soloNoLeidas = true) {
    return this.http.get<ApiResponse<AlertaPaciente[]>>(
      `${environment.apiUrl}/alertas/paciente/${pacienteId}`,
      { params: { soloNoLeidas } },
    );
  }
}
