export const PACIENTE_DEMO_ID = '66a000000000000000000001';
export const PACIENTE_ACTIVO_KEY = 'salud_paciente_activo';
export const PACIENTE_NOMBRE_KEY = 'salud_paciente_nombre';

export function getPacienteActivoId(): string {
  return localStorage.getItem(PACIENTE_ACTIVO_KEY) || PACIENTE_DEMO_ID;
}

export function setPacienteActivo(id: string, nombre: string): void {
  localStorage.setItem(PACIENTE_ACTIVO_KEY, id);
  localStorage.setItem(PACIENTE_NOMBRE_KEY, nombre);
}

export function getPacienteActivoNombre(): string {
  return localStorage.getItem(PACIENTE_NOMBRE_KEY) || 'Carlos Pérez';
}
