import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';
import { Medicamento } from '../models/domain.models';

@Injectable({ providedIn: 'root' })
export class MedicamentoService {
  constructor(private readonly http: HttpClient) {}
  getByPaciente(id: string) { return this.http.get<ApiResponse<Medicamento[]>>(`${environment.apiUrl}/medicamentos/paciente/${id}`); }
  create(body: Partial<Medicamento>) { return this.http.post<ApiResponse<Medicamento>>(`${environment.apiUrl}/medicamentos`, body); }
  createReceta(medicamentos: Partial<Medicamento>[]) { return this.http.post<ApiResponse<Medicamento[]>>(`${environment.apiUrl}/medicamentos/receta`, { medicamentos }); }
  update(id: string, body: Partial<Medicamento>) { return this.http.put<ApiResponse<Medicamento>>(`${environment.apiUrl}/medicamentos/${id}`, body); }
  setEstado(id: string, activo: boolean) { return this.http.patch<ApiResponse<Medicamento>>(`${environment.apiUrl}/medicamentos/${id}/estado`, { activo }); }
  delete(id: string) { return this.http.delete<ApiResponse<null>>(`${environment.apiUrl}/medicamentos/${id}`); }
}
