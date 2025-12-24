import { GetTrackingsByCategoryUseCase } from '../GetTrackingsByCategoryUseCase';
import { ITrackingRepository } from '../../../domain/repositories/ITrackingRepository';
import { TrackingEntity } from '../../../domain/entities/Tracking';
import { TrackingStatus, TrackingCategory, DeliveryChannel } from '../../../domain/types/TrackingTypes';

// Mock implementation
const mockTrackingRepository: jest.Mocked<ITrackingRepository> = {
  findById: jest.fn(),
  findByTrackingCode: jest.fn(),
  findAll: jest.fn(),
  findByCategory: jest.fn(),
  findPendingTrackings: jest.fn(),
  updateStatus: jest.fn(),
};

describe('GetTrackingsByCategoryUseCase', () => {
  let useCase: GetTrackingsByCategoryUseCase;

  beforeEach(() => {
    useCase = new GetTrackingsByCategoryUseCase(mockTrackingRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return trackings filtered by PAC category', async () => {
      const pacTrackings = [
        new TrackingEntity(
          '1',
          12345,
          'Customer 1',
          '12345678901',
          'customer1@example.com',
          11999999999,
          'AA123456789BB',
          TrackingStatus.EM_TRANSITO,
          TrackingCategory.PAC,
          DeliveryChannel.DELIVERY,
          [{ id: '1', name: 'Product 1', quantity: 1, price: 100 }],
          1,
          [],
          '2023-01-01T00:00:00.000Z',
          '2023-01-01T00:00:00.000Z',
          undefined
        ),
        new TrackingEntity(
          '2',
          12346,
          'Customer 2',
          '12345678902',
          'customer2@example.com',
          11999999998,
          'BB123456789CC',
          TrackingStatus.POSTADO,
          TrackingCategory.PAC,
          DeliveryChannel.DELIVERY,
          [{ id: '2', name: 'Product 2', quantity: 2, price: 200 }],
          2,
          [],
          '2023-01-02T00:00:00.000Z',
          '2023-01-02T00:00:00.000Z',
          undefined
        ),
      ];

      mockTrackingRepository.findByCategory.mockResolvedValue(pacTrackings);

      const result = await useCase.execute(TrackingCategory.PAC);

      expect(mockTrackingRepository.findByCategory).toHaveBeenCalledWith(TrackingCategory.PAC);
      expect(result).toEqual(pacTrackings);
      expect(result).toHaveLength(2);
      result.forEach(tracking => {
        expect(tracking.category).toBe(TrackingCategory.PAC);
      });
    });

    it('should return trackings filtered by SEDEX category', async () => {
      const sedexTrackings = [
        new TrackingEntity(
          '3',
          12347,
          'Customer 3',
          '12345678903',
          'customer3@example.com',
          11999999997,
          'CC123456789DD',
          TrackingStatus.ENTREGUE,
          TrackingCategory.SEDEX,
          DeliveryChannel.DELIVERY,
          [{ id: '3', name: 'Product 3', quantity: 1, price: 300 }],
          1,
          [],
          '2023-01-03T00:00:00.000Z',
          '2023-01-03T00:00:00.000Z',
          undefined
        ),
      ];

      mockTrackingRepository.findByCategory.mockResolvedValue(sedexTrackings);

      const result = await useCase.execute(TrackingCategory.SEDEX);

      expect(mockTrackingRepository.findByCategory).toHaveBeenCalledWith(TrackingCategory.SEDEX);
      expect(result).toEqual(sedexTrackings);
      expect(result).toHaveLength(1);
      result.forEach(tracking => {
        expect(tracking.category).toBe(TrackingCategory.SEDEX);
      });
    });

    it('should return empty array when no trackings exist for category', async () => {
      mockTrackingRepository.findByCategory.mockResolvedValue([]);

      const result = await useCase.execute(TrackingCategory.SEDEX);

      expect(mockTrackingRepository.findByCategory).toHaveBeenCalledWith(TrackingCategory.SEDEX);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      mockTrackingRepository.findByCategory.mockRejectedValue(error);

      await expect(useCase.execute(TrackingCategory.PAC)).rejects.toThrow('Database connection failed');
      expect(mockTrackingRepository.findByCategory).toHaveBeenCalledWith(TrackingCategory.PAC);
    });

    it('should maintain tracking of results as returned by repository', async () => {
      const trackingedResults = [
        new TrackingEntity(
          '5',
          12349,
          'Customer 5',
          '12345678905',
          'customer5@example.com',
          11999999995,
          'EE123456789FF',
          TrackingStatus.ENTREGUE,
          TrackingCategory.PAC,
          DeliveryChannel.DELIVERY,
          [],
          0,
          [],
          '2023-01-05T00:00:00.000Z',
          '2023-01-05T00:00:00.000Z',
          undefined
        ),
        new TrackingEntity(
          '4',
          12348,
          'Customer 4',
          '12345678904',
          'customer4@example.com',
          11999999996,
          'DD123456789EE',
          TrackingStatus.EM_TRANSITO,
          TrackingCategory.PAC,
          DeliveryChannel.DELIVERY,
          [],
          0,
          [],
          '2023-01-04T00:00:00.000Z',
          '2023-01-04T00:00:00.000Z',
          undefined
        ),
      ];

      mockTrackingRepository.findByCategory.mockResolvedValue(trackingedResults);

      const result = await useCase.execute(TrackingCategory.PAC);

      expect(result[0].id).toBe('5');
      expect(result[1].id).toBe('4');
    });
  });
});