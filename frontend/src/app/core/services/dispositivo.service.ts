import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Dispositivo, MonitorSensor } from '../models/domain.models';
@Injectable({ providedIn: 'root' }) export class DispositivoService {
  constructor(private readonly http: HttpClient) {}
  getEstado(id: string) { return this.http.get<ApiResponse<Dispositivo>>(`${environment.apiUrl}/dispositivos/${id}/estado`); }
  getMonitor(id: string) { return this.http.get<ApiResponse<MonitorSensor>>(`${environment.apiUrl}/integraciones/firebase/monitor/${encodeURIComponent(id)}`); }
}
