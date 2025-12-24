import { DatabaseTrackingRepository } from '../DatabaseTrackingRepository';
import { supabase } from '../../../config/supabase';
import { TrackingStatus, TrackingCategory, DeliveryChannel } from '../../../domain/types/TrackingTypes';

// Mock do Supabase
jest.mock('../../../config/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        not: jest.fn(() => ({
          not: jest.fn(() => ({
            order: jest.fn()
          }))
        }))
      }))
    }))
  }
}));

describe('DatabaseTrackingRepository', () => {
  let repository: DatabaseTrackingRepository;

  beforeEach(() => {
    repository = new DatabaseTrackingRepository();
    jest.clearAllMocks();
  });

  describe('findPendingTrackings', () => {
    it('should exclude both delivered statuses from results', async () => {
      const mockData = [
        {
          id: '1',
          order_id: 12345,
          name: 'Test Customer',
          cpf: '12345678901',
          email: 'test@example.com',
          contact: 11999999999,
          tracking_code: 'AA123456789BB',
          current_status: TrackingStatus.EM_TRANSITO,
          category: TrackingCategory.PAC,
          delivery_channel: DeliveryChannel.DELIVERY,
          products: [{ id: '1', name: 'Test Product', quantity: 1, price: 100 }],
          quantity: 1,
          events: [],
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z'
        }
      ];

      const mockSelect = jest.fn().mockReturnValue({
        not: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: mockData, error: null })
          })
        })
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: mockSelect
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await repository.findPendingTrackings();

      expect(result).toHaveLength(1);
      expect(result[0].trackingCode).toBe('AA123456789BB');
      expect(result[0].currentStatus).toBe(TrackingStatus.EM_TRANSITO);
      
      // Verificar chamadas do Supabase
      expect(mockFrom).toHaveBeenCalledWith('tracking');
      expect(mockSelect).toHaveBeenCalledWith('*');
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        not: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: null, error: new Error('Database error') })
          })
        })
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: mockSelect
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await repository.findPendingTrackings();

      expect(result).toEqual([]);
    });

    it('should handle empty results', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        not: jest.fn().mockReturnValue({
          not: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: mockSelect
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await repository.findPendingTrackings();

      expect(result).toEqual([]);
    });
  });
});