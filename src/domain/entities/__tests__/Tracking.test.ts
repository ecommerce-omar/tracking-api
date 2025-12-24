import { TrackingEntity } from '../Tracking';
import { TrackingStatus, TrackingCategory, DeliveryChannel } from '../../types/TrackingTypes';
import { createMockTracking } from '../../../__tests__/setup';

describe('TrackingEntity', () => {
  describe('create', () => {
    it('should create a tracking entity from data', () => {
      const trackingData = createMockTracking();
      const tracking = TrackingEntity.create(trackingData);
      
      expect(tracking.id).toBe(trackingData.id);
      expect(tracking.orderId).toBe(trackingData.order_id);
      expect(tracking.name).toBe(trackingData.name);
      expect(tracking.cpf).toBe(trackingData.cpf);
      expect(tracking.email).toBe(trackingData.email);
      expect(tracking.contact).toBe(trackingData.contact);
      expect(tracking.trackingCode).toBe(trackingData.tracking_code);
      expect(tracking.currentStatus).toBe(trackingData.current_status);
      expect(tracking.category).toBe(trackingData.category);
      expect(tracking.deliveryChannel).toBe(trackingData.delivery_channel);
      expect(tracking.products).toEqual(trackingData.products);
      expect(tracking.quantity).toBe(trackingData.quantity);
      expect(tracking.events).toEqual(trackingData.events);
      expect(tracking.dtExpected).toBe(trackingData.dt_expected);
    });

    it('should handle undefined optional fields', () => {
      const trackingData = createMockTracking({
        id: undefined,
        contact: undefined,
        created_at: undefined,
        updated_at: undefined,
        dt_expected: undefined
      });
      
      const tracking = TrackingEntity.create(trackingData);
      
      expect(tracking.id).toBeUndefined();
      expect(tracking.contact).toBeUndefined();
      expect(tracking.createdAt).toBeUndefined();
      expect(tracking.updatedAt).toBeUndefined();
      expect(tracking.dtExpected).toBeUndefined();
    });

    it('should handle contact field correctly', () => {
      const trackingDataWithContact = createMockTracking({
        contact: 11987654321
      });
      
      const tracking = TrackingEntity.create(trackingDataWithContact);
      expect(tracking.contact).toBe(11987654321);
    });
  });

  describe('toPlainObject', () => {
    it('should convert entity to plain object', () => {
      const trackingData = createMockTracking();
      const tracking = TrackingEntity.create(trackingData);
      const plainObject = tracking.toPlainObject();
      
      expect(plainObject).toEqual({
        id: trackingData.id,
        order_id: trackingData.order_id,
        name: trackingData.name,
        cpf: trackingData.cpf,
        email: trackingData.email,
        contact: trackingData.contact,
        tracking_code: trackingData.tracking_code,
        current_status: trackingData.current_status,
        category: trackingData.category,
        delivery_channel: trackingData.delivery_channel,
        products: trackingData.products,
        quantity: trackingData.quantity,
        events: trackingData.events,
        created_at: trackingData.created_at,
        updated_at: trackingData.updated_at,
        dt_expected: trackingData.dt_expected
      });
    });

    it('should convert entity with dt_expected to plain object', () => {
      const trackingData = createMockTracking({
        dt_expected: '2025-09-17T23:59:59+00:00'
      });
      const tracking = TrackingEntity.create(trackingData);
      const plainObject = tracking.toPlainObject();
      
      expect(plainObject.dt_expected).toBe('2025-09-17T23:59:59+00:00');
    });
  });

  describe('hasStatusChanged', () => {
    it('should return true when status has changed', () => {
      const trackingData = createMockTracking({
        current_status: TrackingStatus.EM_TRANSITO
      });
      const tracking = TrackingEntity.create(trackingData);
      
      expect(tracking.hasStatusChanged(TrackingStatus.ENTREGUE)).toBe(true);
    });

    it('should return false when status has not changed', () => {
      const trackingData = createMockTracking({
        current_status: TrackingStatus.EM_TRANSITO
      });
      const tracking = TrackingEntity.create(trackingData);
      
      expect(tracking.hasStatusChanged(TrackingStatus.EM_TRANSITO)).toBe(false);
    });

    it('should handle string comparison with enum', () => {
      const trackingData = createMockTracking({
        current_status: 'Objeto entregue ao destinatário'
      });
      const tracking = TrackingEntity.create(trackingData);
      
      expect(tracking.hasStatusChanged(TrackingStatus.ENTREGUE)).toBe(false);
    });
  });

  describe('constructor', () => {
    it('should create tracking with all properties', () => {
      const tracking = new TrackingEntity(
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
        [{
          id: '1',
          name: 'Test Product',
          quantity: 1,
          price: 100
        }],
        1,
        [{
          date: '2023-01-01T00:00:00.000Z',
          location: 'Test Location',
          status: 'Test Status',
          description: 'Test Description'
        }],
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T00:00:00.000Z',
        '2025-09-17T23:59:59+00:00'
      );
      
      expect(tracking.id).toBe('1');
      expect(tracking.orderId).toBe(12345);
      expect(tracking.name).toBe('Test Customer');
      expect(tracking.cpf).toBe('12345678901');
      expect(tracking.email).toBe('test@example.com');
      expect(tracking.contact).toBe(11999999999);
      expect(tracking.trackingCode).toBe('AA123456789BB');
      expect(tracking.currentStatus).toBe(TrackingStatus.EM_TRANSITO);
      expect(tracking.category).toBe(TrackingCategory.PAC);
      expect(tracking.deliveryChannel).toBe(DeliveryChannel.DELIVERY);
      expect(tracking.products).toHaveLength(1);
      expect(tracking.events).toHaveLength(1);
      expect(tracking.dtExpected).toBe('2025-09-17T23:59:59+00:00');
    });

    it('should create tracking with undefined dt_expected', () => {
      const tracking = new TrackingEntity(
        '1',
        12345,
        'Test Customer',
        '12345678901',
        'test@example.com',
        undefined,
        'AA123456789BB',
        TrackingStatus.EM_TRANSITO,
        TrackingCategory.PAC,
        DeliveryChannel.DELIVERY,
        [],
        0,
        [],
        '2023-01-01T00:00:00.000Z',
        '2023-01-01T00:00:00.000Z',
        undefined
      );
      
      expect(tracking.contact).toBeUndefined();
      expect(tracking.dtExpected).toBeUndefined();
    });
  });
});