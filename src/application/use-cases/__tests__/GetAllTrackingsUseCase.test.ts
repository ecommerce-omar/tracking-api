import { GetAllTrackingsUseCase } from '../GetAllTrackingsUseCase';
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

describe('GetAllTrackingsUseCase', () => {
  let useCase: GetAllTrackingsUseCase;

  beforeEach(() => {
    useCase = new GetAllTrackingsUseCase(mockTrackingRepository);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return all trackings from repository', async () => {
      const mockTrackings = [
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
          TrackingStatus.ENTREGUE,
          TrackingCategory.SEDEX,
          DeliveryChannel.DELIVERY,
          [{ id: '2', name: 'Product 2', quantity: 2, price: 200 }],
          2,
          [],
          '2023-01-02T00:00:00.000Z',
          '2023-01-02T00:00:00.000Z',
          undefined
        ),
      ];

      mockTrackingRepository.findAll.mockResolvedValue(mockTrackings);

      const result = await useCase.execute();

      expect(mockTrackingRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockTrackings);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no trackings exist', async () => {
      mockTrackingRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(mockTrackingRepository.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database connection failed');
      mockTrackingRepository.findAll.mockRejectedValue(error);

      await expect(useCase.execute()).rejects.toThrow('Database connection failed');
      expect(mockTrackingRepository.findAll).toHaveBeenCalledTimes(1);
    });

    it('should maintain order of results as returned by repository', async () => {
      const mockTrackings = [
        new TrackingEntity(
          '3',
          12347,
          'Customer 3',
          '12345678903',
          'customer3@example.com',
          11999999997,
          'CC123456789DD',
          TrackingStatus.POSTADO,
          TrackingCategory.PAC,
          DeliveryChannel.DELIVERY,
          [],
          0,
          [],
          '2023-01-03T00:00:00.000Z',
          '2023-01-03T00:00:00.000Z',
          undefined
        ),
        new TrackingEntity(
          '1',
          12345,
          'Customer 1',
          '12345678901',
          'customer1@example.com',
          11999999999,
          'AA123456789BB',
          TrackingStatus.EM_TRANSITO,
          TrackingCategory.SEDEX,
          DeliveryChannel.DELIVERY,
          [],
          0,
          [],
          '2023-01-01T00:00:00.000Z',
          '2023-01-01T00:00:00.000Z',
          undefined
        ),
      ];

      mockTrackingRepository.findAll.mockResolvedValue(mockTrackings);

      const result = await useCase.execute();

      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
    });
  });
});