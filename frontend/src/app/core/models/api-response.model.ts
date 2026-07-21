export interface ApiResponse<T> { ok: true; mensaje: string; data: T; }
export interface ApiError { ok: false; mensaje: string; errores: unknown[]; }
