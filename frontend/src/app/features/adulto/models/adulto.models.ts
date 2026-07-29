export type EstadoToma = 'PENDIENTE' | 'TOMADA' | 'OMITIDA';
export type MetodoConfirmacion = 'PULSADOR' | 'APP' | 'ADMIN';
export type EstadoSalud = 'NORMAL' | 'REVISAR' | 'ALERTA';

export interface TomaMedicamento {
  _id: string;
  pacienteId: string;
  medicamentoId: string;
  fechaProgramada: string;
  horaProgramada: string;
  estado: EstadoToma;
  metodoConfirmacion: MetodoConfirmacion;
  fechaHoraConfirmacion?: string;
  observacion?: string;
}

export interface MedicamentoHoy {
  _id: string;
  nombre: string;
  concentracion: string;
  dosis: string;
  horaProgramada: string;
  indicaciones: string;
  estado: EstadoToma;
  fechaProgramada?: string;
  medicamentoId?: string;
}

export type TomaMedicamentoDetalle = TomaMedicamento & Omit<MedicamentoHoy, '_id' | 'estado' | 'horaProgramada' | 'medicamentoId' | 'fechaProgramada'>;

export interface Medicion {
  dispositivoId?: string;
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
