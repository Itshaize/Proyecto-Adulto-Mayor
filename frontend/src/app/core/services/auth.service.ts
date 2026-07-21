import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, RolUsuario } from '../models/api.model';

export interface UsuarioSesion { _id: string; nombre: string; correo: string; rol: RolUsuario; pacienteId?: string; }
interface LoginData { token: string; usuario: UsuarioSesion; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly usuarioSignal = signal<UsuarioSesion | null>(this.leerUsuario());
  readonly usuarioActual = this.usuarioSignal.asReadonly();
  constructor(private readonly http: HttpClient) {}
  login(correo: string, password: string) { return this.http.post<ApiResponse<LoginData>>(`${environment.apiUrl}/auth/login`, { correo, password }).pipe(tap(({ data }) => { localStorage.setItem('salud_token', data.token); localStorage.setItem('salud_usuario', JSON.stringify(data.usuario)); this.usuarioSignal.set(data.usuario); })); }
  registerAdmin(nombre: string, correo: string, telefono: string, password: string) { return this.http.post<ApiResponse<LoginData>>(`${environment.apiUrl}/auth/register`, { nombre, correo, telefono, password }).pipe(tap(({ data }) => { localStorage.setItem('salud_token', data.token); localStorage.setItem('salud_usuario', JSON.stringify(data.usuario)); this.usuarioSignal.set(data.usuario); })); }
  logout() { localStorage.removeItem('salud_token'); localStorage.removeItem('salud_usuario'); this.usuarioSignal.set(null); }
  cerrarSesion() { this.logout(); }
  isAuthenticated() { return Boolean(localStorage.getItem('salud_token')); }
  get usuario() { return this.usuarioSignal(); }
  rutaInicial(usuario: UsuarioSesion) { return usuario.rol === 'ADULTO_MAYOR' ? '/adulto/inicio' : '/admin/inicio'; }
  private leerUsuario(): UsuarioSesion | null { try { const raw = localStorage.getItem('salud_usuario'); return raw ? JSON.parse(raw) as UsuarioSesion : null; } catch { return null; } }
}
