import { hasNewEvents } from '../eventComparator';
import { TrackingEvent } from '../../../domain/types/TrackingTypes';

describe('eventComparator', () => {
  describe('hasNewEvents', () => {
    it('should return false when both arrays are empty', () => {
      const oldEvents: TrackingEvent[] = [];
      const newEvents: TrackingEvent[] = [];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(false);
    });

    it('should return true when new events are added', () => {
      const oldEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        }
      ];

      const newEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        },
        {
          description: 'Objeto saiu para entrega',
          status: 'Objeto saiu para entrega',
          date: '2024-01-02T14:00:00Z',
          location: 'Rio de Janeiro - RJ'
        }
      ];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(true);
    });

    it('should return false when events are identical', () => {
      const oldEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        },
        {
          description: 'Objeto em trânsito',
          status: 'Objeto em trânsito',
          date: '2024-01-02T12:00:00Z',
          location: 'Curitiba - PR'
        }
      ];

      const newEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        },
        {
          description: 'Objeto em trânsito',
          status: 'Objeto em trânsito',
          date: '2024-01-02T12:00:00Z',
          location: 'Curitiba - PR'
        }
      ];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(false);
    });

    it('should return false even if events are in different order', () => {
      const oldEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        },
        {
          description: 'Objeto em trânsito',
          status: 'Objeto em trânsito',
          date: '2024-01-02T12:00:00Z',
          location: 'Curitiba - PR'
        }
      ];

      const newEvents: TrackingEvent[] = [
        {
          description: 'Objeto em trânsito',
          status: 'Objeto em trânsito',
          date: '2024-01-02T12:00:00Z',
          location: 'Curitiba - PR'
        },
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        }
      ];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(false);
    });

    it('should return true when any event field changes', () => {
      const oldEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        }
      ];

      const newEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'Rio de Janeiro - RJ' // Location changed
        }
      ];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(true);
    });

    it('should handle events without location field', () => {
      const oldEvents: TrackingEvent[] = [
        {
          description: 'Etiqueta emitida',
          status: 'Etiqueta emitida',
          location: 'Centro de Distribuição',
          date: '2024-01-01T08:00:00Z'
        }
      ];

      const newEvents: TrackingEvent[] = [
        {
          description: 'Etiqueta emitida',
          status: 'Etiqueta emitida',
          location: 'Centro de Distribuição',
          date: '2024-01-01T08:00:00Z'
        }
      ];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(false);
    });

    it('should return true when number of events decreases', () => {
      const oldEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        },
        {
          description: 'Objeto em trânsito',
          status: 'Objeto em trânsito',
          date: '2024-01-02T12:00:00Z',
          location: 'Curitiba - PR'
        }
      ];

      const newEvents: TrackingEvent[] = [
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        }
      ];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(true);
    });

    it('should handle complex real-world scenario', () => {
      const oldEvents: TrackingEvent[] = [
        {
          description: 'Etiqueta emitida',
          status: 'Etiqueta emitida',
          location: 'Centro de Distribuição',
          date: '2024-01-01T08:00:00Z'
        },
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        }
      ];

      const newEvents: TrackingEvent[] = [
        {
          description: 'Etiqueta emitida',
          status: 'Etiqueta emitida',
          location: 'Centro de Distribuição',
          date: '2024-01-01T08:00:00Z'
        },
        {
          description: 'Objeto postado',
          status: 'Objeto postado',
          date: '2024-01-01T10:00:00Z',
          location: 'São Paulo - SP'
        },
        {
          description: 'Objeto em transferência - por favor aguarde',
          status: 'Objeto em transferência - por favor aguarde',
          date: '2024-01-02T15:30:00Z',
          location: 'Centro de Distribuição - Campinas - SP'
        },
        {
          description: 'Objeto saiu para entrega ao destinatário',
          status: 'Objeto saiu para entrega ao destinatário',
          date: '2024-01-03T08:45:00Z',
          location: 'Unidade de Distribuição - Rio de Janeiro - RJ'
        }
      ];

      expect(hasNewEvents(oldEvents, newEvents)).toBe(true);
    });
  });
});
