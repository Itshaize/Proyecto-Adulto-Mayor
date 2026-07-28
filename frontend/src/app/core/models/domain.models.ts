import { EstadoDispositivo, EstadoSalud, EstadoToma, MetodoConfirmacion } from './api.model';

export interface Paciente { _id: string; nombre: string; edad: number; fechaNacimiento: string; diagnosticos: string[]; telefonoContacto: string; hijoAdminId: string; usuarioAdultoId: string; dispositivoId: string; activo: boolean; correoAcceso?: string; passwordAcceso?: string; }
export interface Medicamento { _id: string; pacienteId: string; nombre: string; concentracion: string; dosis: string; horarios: string[]; frecuencia: string; indicaciones: string; activo: boolean; tieneHistorial?: boolean; recetaMedico?: string; recetaFecha?: string; recetaObservacion?: string; }
export interface Toma { _id: string; pacienteId: string; medicamentoId: string; medicamento: string; nombre?: string; concentracion?: string; dosis: string; indicaciones?: string; fechaProgramada: string; horaProgramada: string; estado: EstadoToma; metodoConfirmacion: MetodoConfirmacion | null; fechaHoraConfirmacion: string | null; }
export interface Medicion { _id: string; pacienteId: string; dispositivoId: string; pulsaciones: number; spo2: number; estadoSalud: EstadoSalud; fechaHora: string; }
export interface Alerta { _id: string; pacienteId: string; tipo: string; titulo: string; mensaje: string; nivel: 'INFORMATIVA' | 'ADVERTENCIA' | 'CRITICA'; leida: boolean; fechaHora: string; }
export interface Dispositivo { _id: string; dispositivoId: string; pacienteId: string; estado: EstadoDispositivo; ultimaConexion: string | null; versionFirmware: string; }
export interface ResumenAdmin { paciente: Paciente; ultimaMedicion: Medicion | null; medicamentosHoy: Toma[]; tomasResumen: { tomadas: number; pendientes: number; total: number }; mediciones: Medicion[]; alertas: Alerta[]; dispositivo: Dispositivo | null; }
