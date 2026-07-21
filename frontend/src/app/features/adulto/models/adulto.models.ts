export type EstadoToma = 'PENDIENTE' | 'TOMADA' | 'OMITIDA';
export type MetodoConfirmacion = 'PULSADOR' | 'APP' | 'ADMIN';
export type EstadoSalud = 'NORMAL' | 'REVISAR' | 'ALERTA';

export interface MedicamentoHoy {
  _id: string;
  nombre: string;
  concentracion: string;
  dosis: string;
  horaProgramada: string;
  indicaciones: string;
  estado: EstadoToma;
}

export interface Medicion {
  fechaHora: string;
  pulsaciones: number;
  spo2: number;
  estadoSalud: EstadoSalud;
}

export interface HistorialToma {
  fecha: string;
  tomadas: number;
  total: number;
}
