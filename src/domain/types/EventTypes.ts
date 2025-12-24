// Tipos de eventos de domínio
export interface DomainEvent {
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventType: string;
}

export interface TrackingStatusChangedEventData {
  trackingId: string;
  trackingCode: string;
  customerName: string;
  customerEmail: string;
  previousStatus: string;
  newStatus: string;
  timestamp: Date;
}

export interface TrackingCreatedEventData {
  trackingId: string;
  trackingCode: string;
  customerName: string;
  customerEmail: string;
  timestamp: Date;
}
