// Tipos compartilhados entre camadas
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Result<T, E = Error> {
  success: boolean;
  data?: T;
  error?: E;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Tipos para configuração
export interface AppConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  database: {
    url: string;
    key: string;
  };
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
  correios: {
    apiKey: string;
    username: string;
    postalCard: string;
  };
}
