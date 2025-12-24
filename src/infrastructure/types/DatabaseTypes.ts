// Tipos específicos da infraestrutura de banco de dados
export interface SupabaseConfig {
  url: string;
  key: string;
}

export interface DatabaseConnection {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
}

export interface QueryResult<T> {
  data: T[];
  error: string | null;
  count?: number;
}

// Use PaginationMeta from CommonTypes instead

export interface DatabaseError {
  code: string;
  message: string;
  details?: any;
}
