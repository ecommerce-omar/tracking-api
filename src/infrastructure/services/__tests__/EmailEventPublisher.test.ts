import { EmailEventPublisher } from '../EmailEventPublisher';
import { TrackingStatusChangedEvent } from '../../../domain/events/TrackingStatusChangedEvent';
import { TrackingStatus, DeliveryChannel } from '../../../domain/types/TrackingTypes';

// Mock the email sender
jest.mock('../../../middlewares/emailSender', () => ({
  sendTrackingEmail: jest.fn()
}));

// Mock the logger
jest.mock('../../../shared/utils/Logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

const { sendTrackingEmail } = require('../../../middlewares/emailSender');

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('EmailEventPublisher', () => {
  let publisher: EmailEventPublisher;

  beforeEach(() => {
    publisher = new EmailEventPublisher();
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('publish', () => {
    const mockEvent: TrackingStatusChangedEvent = {
      trackingId: '1',
      trackingCode: 'AA123456789BB',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      products: 'Test Product',
      previousStatus: TrackingStatus.EM_TRANSITO,
      newStatus: TrackingStatus.ENTREGUE,
      deliveryChannel: DeliveryChannel.DELIVERY,
      timestamp: new Date('2023-01-01T12:00:00.000Z')
    };

    it('should send email successfully and log success', async () => {
      sendTrackingEmail.mockResolvedValue(undefined);

      await publisher.publish(mockEvent);

      expect(sendTrackingEmail).toHaveBeenCalledWith({
        customer_name: 'Test Customer',
        email: 'test@example.com',
        tracking_code: 'AA123456789BB',
        products: 'Test Product',
        status: TrackingStatus.ENTREGUE
      });

      const { logger } = require('../../../shared/utils/Logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Email de mudança de status enviado com sucesso',
        expect.objectContaining({
          customerEmail: 'test@example.com',
          trackingCode: 'AA123456789BB'
        })
      );
    });

    it('should handle email sending errors gracefully', async () => {
      const emailError = new Error('SMTP connection failed');
      sendTrackingEmail.mockRejectedValue(emailError);

      // Should not throw error
      await expect(publisher.publish(mockEvent)).resolves.toBeUndefined();

      expect(sendTrackingEmail).toHaveBeenCalledWith({
        customer_name: 'Test Customer',
        email: 'test@example.com',
        tracking_code: 'AA123456789BB',
        products: 'Test Product',
        status: TrackingStatus.ENTREGUE
      });

      const { logger } = require('../../../shared/utils/Logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao enviar email de mudança de status',
        emailError,
        expect.objectContaining({
          customerEmail: 'test@example.com',
          trackingCode: 'AA123456789BB'
        })
      );

      // Should not log success message
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should handle different tracking status transitions', async () => {
      sendTrackingEmail.mockResolvedValue(undefined);

      const eventWithDifferentStatus: TrackingStatusChangedEvent = {
        ...mockEvent,
        previousStatus: TrackingStatus.POSTADO,
        newStatus: TrackingStatus.SAIU_PARA_ENTREGA
      };

      await publisher.publish(eventWithDifferentStatus);

      expect(sendTrackingEmail).toHaveBeenCalledWith({
        customer_name: 'Test Customer',
        email: 'test@example.com',
        tracking_code: 'AA123456789BB',
        products: 'Test Product',
        status: TrackingStatus.SAIU_PARA_ENTREGA
      });

      const { logger } = require('../../../shared/utils/Logger');
      expect(logger.info).toHaveBeenCalledWith(
        'Email de mudança de status enviado com sucesso',
        expect.objectContaining({
          customerEmail: 'test@example.com',
          previousStatus: TrackingStatus.POSTADO,
          newStatus: TrackingStatus.SAIU_PARA_ENTREGA
        })
      );
    });

    it('should handle events with multiple products', async () => {
      sendTrackingEmail.mockResolvedValue(undefined);

      const eventWithMultipleProducts: TrackingStatusChangedEvent = {
        ...mockEvent,
        products: 'Product 1, Product 2, Product 3'
      };

      await publisher.publish(eventWithMultipleProducts);

      expect(sendTrackingEmail).toHaveBeenCalledWith({
        customer_name: 'Test Customer',
        email: 'test@example.com',
        tracking_code: 'AA123456789BB',
        products: 'Product 1, Product 2, Product 3',
        status: TrackingStatus.ENTREGUE
      });
    });

    it('should handle events with special characters in customer name', async () => {
      sendTrackingEmail.mockResolvedValue(undefined);

      const eventWithSpecialChars: TrackingStatusChangedEvent = {
        ...mockEvent,
        customerName: 'José da Silva Ãlvares'
      };

      await publisher.publish(eventWithSpecialChars);

      expect(sendTrackingEmail).toHaveBeenCalledWith({
        customer_name: 'José da Silva Ãlvares',
        email: 'test@example.com',
        tracking_code: 'AA123456789BB',
        products: 'Test Product',
        status: TrackingStatus.ENTREGUE
      });
    });

    it('should not propagate email errors to prevent breaking main flow', async () => {
      sendTrackingEmail.mockRejectedValue(new Error('Network timeout'));

      // This should complete without throwing
      await publisher.publish(mockEvent);

      const { logger } = require('../../../shared/utils/Logger');
      expect(logger.error).toHaveBeenCalledWith(
        'Erro ao enviar email de mudança de status',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should handle undefined or null email gracefully', async () => {
      sendTrackingEmail.mockResolvedValue(undefined);

      const eventWithNullEmail: TrackingStatusChangedEvent = {
        ...mockEvent,
        customerEmail: null as any
      };

      await publisher.publish(eventWithNullEmail);

      expect(sendTrackingEmail).toHaveBeenCalledWith({
        customer_name: 'Test Customer',
        email: null,
        tracking_code: 'AA123456789BB',
        products: 'Test Product',
        status: TrackingStatus.ENTREGUE
      });
    });
  });
});