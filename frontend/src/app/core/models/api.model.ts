export interface ApiResponse<T> { ok: boolean; mensaje: string; data: T; errores?: { msg: string }[]; }
export type RolUsuario = 'HIJO_ADMIN' | 'ADULTO_MAYOR' | 'TECNICO';
export type EstadoToma = 'PENDIENTE' | 'TOMADA' | 'OMITIDA';
export type MetodoConfirmacion = 'PULSADOR' | 'APP' | 'ADMIN';
export type EstadoDispositivo = 'CONECTADO' | 'DESCONECTADO' | 'ERROR';
export type EstadoSalud = 'NORMAL' | 'REVISAR' | 'ALERTA';

