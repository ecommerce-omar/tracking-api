import { TrackingStatus, TrackingCategory, DeliveryChannel } from '../domain/types/TrackingTypes';

// Mock environment variables for Supabase
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-key';
process.env.MAIL_USER = 'test@example.com';

// Jest setup file
beforeAll(() => {
  // Setup global test configuration
});

afterAll(() => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});

// Global test utilities
export const createMockTracking = (overrides = {}) => ({
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
  products: [
    {
      id: '1',
      name: 'Test Product',
      quantity: 1,
      price: 100
    }
  ],
  quantity: 1,
  events: [],
  created_at: '2023-01-01T00:00:00.000Z',
  updated_at: '2023-01-01T00:00:00.000Z',
  dt_expected: undefined, // Default to undefined, can be overridden
  ...overrides
});

// Test placeholder to prevent Jest error
test('setup file loads correctly', () => {
  expect(true).toBe(true);
});