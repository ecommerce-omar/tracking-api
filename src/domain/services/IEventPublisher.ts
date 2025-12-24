import { TrackingStatusChangedEvent } from '../events/TrackingStatusChangedEvent';

export interface IEventPublisher {
  publish(event: TrackingStatusChangedEvent): Promise<void>;
}
