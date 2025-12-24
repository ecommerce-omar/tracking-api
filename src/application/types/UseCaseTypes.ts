import { TrackingStatus, TrackingEvent } from '../../domain/types/TrackingTypes';
import { TrackingEntity } from '../../domain/entities/Tracking';

// Tipos para casos de uso de consulta e atualização (não criação)
export interface UpdateTrackingStatusRequest {
  trackingCode: string;
  newStatus: TrackingStatus;
  events: TrackingEvent[];
  dtExpected?: string;
}

export interface UpdateTrackingStatusResponse {
  tracking: TrackingEntity;
  statusChanged: boolean;
}

export interface GetTrackingByTrackingCodeRequest {
  trackingCode: string;
}

export interface GetAllTrackingsRequest {
  // Parâmetros de paginação, filtros, etc.
  page?: number;
  limit?: number;
  status?: TrackingStatus;
}
