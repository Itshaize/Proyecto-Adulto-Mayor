import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type FormatoReporte = 'xlsx' | 'pdf';
export type SeccionReporte = 'todas' | 'medicacion' | 'salud';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  constructor(private readonly http: HttpClient) {}

  descargarHistorial(pacienteId: string, formato: FormatoReporte, seccion: SeccionReporte, desde = '', hasta = '') {
    let params = new HttpParams().set('formato', formato).set('seccion', seccion);
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get(`${environment.apiUrl}/pacientes/${pacienteId}/exportar`, {
      params, observe: 'response', responseType: 'blob',
    });
  }

  guardarArchivo(response: HttpResponse<Blob>, fallbackName: string): void {
    const disposition = response.headers.get('content-disposition') || '';
    const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallbackName;
    const url = URL.createObjectURL(response.body || new Blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
