// Central type exports following Clean Architecture
// Each layer maintains its own types with minimal coupling

// Domain Types (Core Business Logic)
export * from '../domain/types/TrackingTypes';
export * from '../domain/types/EventTypes';
export * from '../domain/entities/Tracking';

// Application Types (Use Cases)
export * from '../application/types/UseCaseTypes';

// Infrastructure Types (External Concerns)
export * from '../infrastructure/types/DatabaseTypes';
export * from '../infrastructure/types/EmailTypes';

// Presentation Types (Controllers & API)
export * from '../presentation/types/ControllerTypes';

// Shared Types (Cross-Layer)
export * from '../shared/types/CommonTypes';

// Validation Schemas (Input Validation)
export * from '../schemas/trackingSchema';
export * from '../schemas/templateSchema';
