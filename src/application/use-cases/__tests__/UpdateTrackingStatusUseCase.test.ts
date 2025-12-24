import { UpdateTrackingStatusUseCase } from '../UpdateTrackingStatusUseCase';
import { ITrackingRepository } from '../../../domain/repositories/ITrackingRepository';
import { IEventPublisher } from '../../../domain/services/IEventPublisher';
import { TrackingEntity } from '../../../domain/entities/Tracking';
import { TrackingStatus, TrackingCategory, DeliveryChannel } from '../../../domain/types/TrackingTypes';
import { UpdateTrackingStatusRequest } from '../../types/UseCaseTypes';

// Mock implementations
const mockTrackingRepository: jest.Mocked<ITrackingRepository> = {
  findById: jest.fn(),
  findByTrackingCode: jest.fn(),
  findAll: jest.fn(),
  findByCategory: jest.fn(),
  findPendingTrackings: jest.fn(),
  updateStatus: jest.fn(),
};

const mockEventPublisher: jest.Mocked<IEventPublisher> = {
  publish: jest.fn(),
};

describe('UpdateTrackingStatusUseCase', () => {
  let useCase: UpdateTrackingStatusUseCase;

  beforeEach(() => {
    useCase = new UpdateTrackingStatusUseCase(mockTrackingRepository, mockEventPublisher);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockTracking = new TrackingEntity(
      '1',
      12345,
      'Test Customer',
      '12345678901',
      'test@example.com',
      11999999999,
      'AA123456789BB',
      TrackingStatus.EM_TRANSITO,
      TrackingCategory.PAC,
      DeliveryChannel.DELIVERY,
      [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
      1,
      [],
      '2023-01-01T00:00:00.000Z',
      '2023-01-01T00:00:00.000Z',
      undefined
    );

    it('should update tracking status successfully when status changed', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'AA123456789BB',
        newStatus: TrackingStatus.ENTREGUE,
        events: [
          {
            date: '2023-01-02T00:00:00.000Z',
            location: 'Test Location',
            status: 'Entregue',
            description: 'Objeto entregue'
          }
        ]
      };

      const updatedTracking = new TrackingEntity(
        '1',
        12345,
        'Test Customer',
        '12345678901',
        'test@example.com',
        11999999999,
        'AA123456789BB',
        TrackingStatus.ENTREGUE,
        TrackingCategory.PAC,
        DeliveryChannel.DELIVERY,
        [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
        1,
        request.events,
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        undefined
      );

      mockTrackingRepository.findByTrackingCode.mockResolvedValue(mockTracking);
      mockTrackingRepository.updateStatus.mockResolvedValue(updatedTracking);
      mockEventPublisher.publish.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(mockTrackingRepository.findByTrackingCode).toHaveBeenCalledWith('AA123456789BB');
      expect(mockTrackingRepository.updateStatus).toHaveBeenCalledWith(
        'AA123456789BB',
        TrackingStatus.ENTREGUE,
        request.events,
        undefined
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          trackingId: '1',
          trackingCode: 'AA123456789BB',
          previousStatus: TrackingStatus.EM_TRANSITO,
          newStatus: TrackingStatus.ENTREGUE
        })
      );
      expect(result.statusChanged).toBe(true);
      expect(result.tracking).toBe(updatedTracking);
    });

    it('should update tracking status without publishing event when status unchanged', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'AA123456789BB',
        newStatus: TrackingStatus.EM_TRANSITO, // Same status
        events: []
      };

      const updatedTracking = new TrackingEntity(
        '1',
        12345,
        'Test Customer',
        '12345678901',
        'test@example.com',
        11999999999,
        'AA123456789BB',
        TrackingStatus.EM_TRANSITO,
        TrackingCategory.PAC,
        DeliveryChannel.DELIVERY,
        [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
        1,
        [],
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T00:00:00.000Z',
        undefined
      );

      mockTrackingRepository.findByTrackingCode.mockResolvedValue(mockTracking);
      mockTrackingRepository.updateStatus.mockResolvedValue(updatedTracking);

      const result = await useCase.execute(request);

      expect(mockTrackingRepository.findByTrackingCode).toHaveBeenCalledWith('AA123456789BB');
      expect(mockTrackingRepository.updateStatus).toHaveBeenCalledWith(
        'AA123456789BB',
        TrackingStatus.EM_TRANSITO,
        request.events,
        undefined
      );
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
      expect(result.statusChanged).toBe(false);
      expect(result.tracking).toBe(updatedTracking);
    });

    it('should throw error when tracking not found', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'NONEXISTENT',
        newStatus: TrackingStatus.ENTREGUE,
        events: []
      };

      mockTrackingRepository.findByTrackingCode.mockResolvedValue(null);

      await expect(useCase.execute(request)).rejects.toThrow('Tracking não encontrado');
      expect(mockTrackingRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'AA123456789BB',
        newStatus: TrackingStatus.ENTREGUE,
        events: []
      };

      mockTrackingRepository.findByTrackingCode.mockRejectedValue(new Error('Database error'));

      await expect(useCase.execute(request)).rejects.toThrow('Database error');
      expect(mockTrackingRepository.updateStatus).not.toHaveBeenCalled();
      expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    });

    it('should handle event publisher errors gracefully', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'AA123456789BB',
        newStatus: TrackingStatus.ENTREGUE,
        events: []
      };

      const updatedTracking = new TrackingEntity(
        '1',
        12345,
        'Test Customer',
        '12345678901',
        'test@example.com',
        11999999999,
        'AA123456789BB',
        TrackingStatus.ENTREGUE,
        TrackingCategory.PAC,
        DeliveryChannel.DELIVERY,
        [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
        1,
        [],
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        undefined
      );

      mockTrackingRepository.findByTrackingCode.mockResolvedValue(mockTracking);
      mockTrackingRepository.updateStatus.mockResolvedValue(updatedTracking);
      mockEventPublisher.publish.mockRejectedValue(new Error('Email service error'));

      // Should not throw error, but event publisher error should propagate
      await expect(useCase.execute(request)).rejects.toThrow('Email service error');
    });

    it('should handle DIRECIONADO_UNIDADE status update', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'AA123456789BB',
        newStatus: TrackingStatus.DIRECIONADO_UNIDADE,
        events: [
          {
            date: '2023-01-02T00:00:00.000Z',
            location: 'Agência dos Correios',
            status: 'Em transferência',
            description: 'Direcionado para entrega em unidade dos Correios a pedido do cliente',
            detail: 'Objeto será entregue na agência solicitada',
            unitType: 'Agência dos Correios',
            unitAddress: {
              cep: '12345-678',
              logradouro: 'Rua Exemplo',
              numero: '123',
              bairro: 'Centro',
              cidade: 'São Paulo',
              uf: 'SP'
            }
          }
        ]
      };

      const updatedTracking = new TrackingEntity(
        '1',
        12345,
        'Test Customer',
        '12345678901',
        'test@example.com',
        11999999999,
        'AA123456789BB',
        TrackingStatus.DIRECIONADO_UNIDADE,
        TrackingCategory.PAC,
        DeliveryChannel.DELIVERY,
        [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
        1,
        request.events,
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        undefined
      );

      mockTrackingRepository.findByTrackingCode.mockResolvedValue(mockTracking);
      mockTrackingRepository.updateStatus.mockResolvedValue(updatedTracking);
      mockEventPublisher.publish.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(mockTrackingRepository.updateStatus).toHaveBeenCalledWith(
        'AA123456789BB',
        TrackingStatus.DIRECIONADO_UNIDADE,
        request.events,
        undefined
      );
      expect(result.statusChanged).toBe(true);
      expect(result.tracking.currentStatus).toBe(TrackingStatus.DIRECIONADO_UNIDADE);
    });

    it('should handle ENTREGUE_CAIXA_INTELIGENTE status update', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'AA123456789BB',
        newStatus: TrackingStatus.ENTREGUE_CAIXA_INTELIGENTE,
        events: [
          {
            date: '2023-01-02T00:00:00.000Z',
            location: 'Caixa de Correios Inteligente',
            status: 'Entregue',
            description: 'Objeto entregue na Caixa de Correios Inteligente',
            detail: 'Objeto disponível para retirada',
            unitType: 'Caixa de Correios Inteligente',
            unitAddress: {
              cep: '12345-678',
              logradouro: 'Av. Principal',
              numero: '456',
              bairro: 'Centro',
              cidade: 'São Paulo',
              uf: 'SP'
            }
          }
        ]
      };

      const updatedTracking = new TrackingEntity(
        '1',
        12345,
        'Test Customer',
        '12345678901',
        'test@example.com',
        11999999999,
        'AA123456789BB',
        TrackingStatus.ENTREGUE_CAIXA_INTELIGENTE,
        TrackingCategory.PAC,
        DeliveryChannel.DELIVERY,
        [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
        1,
        request.events,
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        undefined
      );

      mockTrackingRepository.findByTrackingCode.mockResolvedValue(mockTracking);
      mockTrackingRepository.updateStatus.mockResolvedValue(updatedTracking);
      mockEventPublisher.publish.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(mockTrackingRepository.updateStatus).toHaveBeenCalledWith(
        'AA123456789BB',
        TrackingStatus.ENTREGUE_CAIXA_INTELIGENTE,
        request.events,
        undefined
      );
      expect(result.statusChanged).toBe(true);
      expect(result.tracking.currentStatus).toBe(TrackingStatus.ENTREGUE_CAIXA_INTELIGENTE);
    });

    it('should update tracking status with dtExpected when provided', async () => {
      const request: UpdateTrackingStatusRequest = {
        trackingCode: 'AA123456789BB',
        newStatus: TrackingStatus.ENTREGUE,
        events: [
          {
            date: '2023-01-02T00:00:00.000Z',
            location: 'Test Location',
            status: 'Entregue',
            description: 'Objeto entregue'
          }
        ],
        dtExpected: '2025-09-17T23:59:59+00:00'
      };

      const updatedTracking = new TrackingEntity(
        '1',
        12345,
        'Test Customer',
        '12345678901',
        'test@example.com',
        11999999999,
        'AA123456789BB',
        TrackingStatus.ENTREGUE,
        TrackingCategory.PAC,
        DeliveryChannel.DELIVERY,
        [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
        1,
        request.events,
        '2023-01-01T00:00:00.000Z',
        '2023-01-02T00:00:00.000Z',
        '2025-09-17T23:59:59+00:00'
      );

      mockTrackingRepository.findByTrackingCode.mockResolvedValue(mockTracking);
      mockTrackingRepository.updateStatus.mockResolvedValue(updatedTracking);
      mockEventPublisher.publish.mockResolvedValue();

      const result = await useCase.execute(request);

      expect(mockTrackingRepository.updateStatus).toHaveBeenCalledWith(
        'AA123456789BB',
        TrackingStatus.ENTREGUE,
        request.events,
        '2025-09-17T23:59:59+00:00'
      );
      expect(result.statusChanged).toBe(true);
      expect(result.tracking.dtExpected).toBe('2025-09-17T23:59:59+00:00');
    });
  });
});