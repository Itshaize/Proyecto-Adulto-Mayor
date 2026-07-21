import { Injectable, computed, signal } from '@angular/core';
import { UsuarioSesion } from '../models/usuario.model';

interface CredencialesDemo { correo: string; password: string; usuario: UsuarioSesion; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'kairos_sesion_demo';
  private readonly sesion = signal<UsuarioSesion | null>(this.leerSesion());
  readonly usuarioActual = this.sesion.asReadonly();
  readonly autenticado = computed(() => this.sesion() !== null);

  private readonly usuariosDemo: CredencialesDemo[] = [
    { correo: 'adulto@kairos.com', password: 'Adulto123!', usuario: { _id: 'usuario-adulto-demo', nombre: 'Carlos Pérez', correo: 'adulto@kairos.com', rol: 'ADULTO_MAYOR', pacienteId: 'CARLOS-PEREZ-DEMO', token: 'TOKEN_DEMO_NO_USAR_EN_PRODUCCION' } },
    { correo: 'admin@kairos.com', password: 'Admin123!', usuario: { _id: 'usuario-admin-demo', nombre: 'Daniel Pérez', correo: 'admin@kairos.com', rol: 'HIJO_ADMIN', token: 'TOKEN_DEMO_NO_USAR_EN_PRODUCCION' } },
  ];

  async iniciarSesion(correo: string, password: string): Promise<UsuarioSesion> {
    await new Promise((resolve) => setTimeout(resolve, 550));
    const registro = this.usuariosDemo.find((item) => item.correo === correo.trim().toLowerCase() && item.password === password);
    if (!registro) throw new Error('El correo o la contraseña no son correctos. Inténtelo nuevamente.');
    this.sesion.set(registro.usuario);
    localStorage.setItem(this.storageKey, JSON.stringify(registro.usuario));
    return registro.usuario;
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.storageKey);
    this.sesion.set(null);
  }

  rutaInicial(usuario: UsuarioSesion): string {
    if (usuario.rol === 'HIJO_ADMIN') return '/admin/inicio';
    if (usuario.rol === 'ADULTO_MAYOR') return '/adulto/inicio';
    return '/pruebas/dispositivo';
  }

  private leerSesion(): UsuarioSesion | null {
    try { return JSON.parse(localStorage.getItem(this.storageKey) ?? 'null'); }
    catch { return null; }
  }
}
