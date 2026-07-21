export type RolUsuario = 'HIJO_ADMIN' | 'ADULTO_MAYOR' | 'TECNICO';

export interface UsuarioSesion {
  _id: string;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  pacienteId?: string;
  token: string;
}
