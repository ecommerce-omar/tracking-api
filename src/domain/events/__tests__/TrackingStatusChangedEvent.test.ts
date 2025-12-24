import { TrackingStatusChangedEventEntity, TrackingStatusChangedEvent } from '../TrackingStatusChangedEvent';
import { TrackingEntity } from '../../entities/Tracking';
import { TrackingStatus, TrackingCategory, DeliveryChannel } from '../../types/TrackingTypes';
import { createMockTracking } from '../../../__tests__/setup';

describe('TrackingStatusChangedEventEntity', () => {
  describe('constructor', () => {
    it('should create event entity with all properties', () => {
      const event = new TrackingStatusChangedEventEntity(
        '1',
        'AA123456789BB',
        'Test Customer',
        'test@example.com',
        'Test Product',
        TrackingStatus.EM_TRANSITO,
        TrackingStatus.ENTREGUE,
        DeliveryChannel.DELIVERY
      );

      expect(event.trackingId).toBe('1');
      expect(event.trackingCode).toBe('AA123456789BB');
      expect(event.customerName).toBe('Test Customer');
      expect(event.customerEmail).toBe('test@example.com');
      expect(event.products).toBe('Test Product');
      expect(event.previousStatus).toBe(TrackingStatus.EM_TRANSITO);
      expect(event.newStatus).toBe(TrackingStatus.ENTREGUE);
      expect(event.deliveryChannel).toBe(DeliveryChannel.DELIVERY);
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should use current date as default timestamp', () => {
      const beforeCreate = new Date();
      const event = new TrackingStatusChangedEventEntity(
        '1',
        'AA123456789BB',
        'Test Customer',
        'test@example.com',
        'Test Product',
        TrackingStatus.EM_TRANSITO,
        TrackingStatus.ENTREGUE,
        DeliveryChannel.DELIVERY
      );
      const afterCreate = new Date();

      expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(event.timestamp.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
    });
  });

  describe('fromTracking', () => {
    it('should create event entity from tracking', () => {
      const trackingData = createMockTracking({
        id: '1',
        tracking_code: 'AA123456789BB',
        name: 'Test Customer',
        email: 'test@example.com',
        current_status: TrackingStatus.EM_TRANSITO,
        products: [
          { id: '1', name: 'Product 1', quantity: 1, price: 100 },
          { id: '2', name: 'Product 2', quantity: 2, price: 200 }
        ]
      });
      
      const tracking = TrackingEntity.create(trackingData);
      const newStatus = TrackingStatus.ENTREGUE;
      
      const event = TrackingStatusChangedEventEntity.fromTracking(tracking, newStatus);

      expect(event.trackingId).toBe('1');
      expect(event.trackingCode).toBe('AA123456789BB');
      expect(event.customerName).toBe('Test Customer');
      expect(event.customerEmail).toBe('test@example.com');
      expect(event.products).toBe('Product 1, Product 2');
      expect(event.previousStatus).toBe(TrackingStatus.EM_TRANSITO);
      expect(event.newStatus).toBe(TrackingStatus.ENTREGUE);
      expect(event.deliveryChannel).toBe(DeliveryChannel.DELIVERY);
    });

    it('should handle tracking with no products', () => {
      const trackingData = createMockTracking({
        products: []
      });
      
      const tracking = TrackingEntity.create(trackingData);
      const newStatus = TrackingStatus.ENTREGUE;
      
      const event = TrackingStatusChangedEventEntity.fromTracking(tracking, newStatus);

      expect(event.products).toBe('N/A');
    });

    it('should handle single product', () => {
      const trackingData = createMockTracking({
        products: [
          { id: '1', name: 'Single Product', quantity: 1, price: 100 }
        ]
      });
      
      const tracking = TrackingEntity.create(trackingData);
      const newStatus = TrackingStatus.ENTREGUE;
      
      const event = TrackingStatusChangedEventEntity.fromTracking(tracking, newStatus);

      expect(event.products).toBe('Single Product');
    });
  });

  describe('toPlainObject', () => {
    it('should convert to plain object interface', () => {
      const timestamp = new Date('2023-01-01T12:00:00.000Z');
      const event = new TrackingStatusChangedEventEntity(
        '1',
        'AA123456789BB',
        'Test Customer',
        'test@example.com',
        'Test Product',
        TrackingStatus.EM_TRANSITO,
        TrackingStatus.ENTREGUE,
        DeliveryChannel.DELIVERY,
        timestamp
      );

      const plainObject: TrackingStatusChangedEvent = event.toPlainObject();

      expect(plainObject).toEqual({
        trackingId: '1',
        trackingCode: 'AA123456789BB',
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        products: 'Test Product',
        previousStatus: TrackingStatus.EM_TRANSITO,
        newStatus: TrackingStatus.ENTREGUE,
        deliveryChannel: DeliveryChannel.DELIVERY,
        timestamp: timestamp
      });
    });
  });
});