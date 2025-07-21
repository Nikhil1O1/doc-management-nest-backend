# Microservice Architecture Implementation Plan

## Current State Analysis

### ✅ Existing Microservice Patterns
- Modular service separation (Auth, Users, Documents, Ingestion)
- External service integration (Python backend)
- Docker containerization
- Environment-based configuration

### ❌ Missing Microservice Components
- Message queues/event bus
- Service discovery
- Circuit breakers
- Independent databases
- API Gateway
- Distributed tracing

## Phase 1: Message Queue Integration

### 1.1 Add RabbitMQ/Redis for Event Bus
```bash
# Add to docker-compose.yml
rabbitmq:
  image: rabbitmq:3-management
  ports:
    - "5672:5672"
    - "15672:15672"
  environment:
    RABBITMQ_DEFAULT_USER: admin
    RABBITMQ_DEFAULT_PASS: admin123
```

### 1.2 Create Event-Driven Architecture
```typescript
// events/document-uploaded.event.ts
export class DocumentUploadedEvent {
  constructor(
    public readonly documentId: string,
    public readonly userId: string,
    public readonly filePath: string,
    public readonly mimeType: string,
  ) {}
}

// events/ingestion-completed.event.ts
export class IngestionCompletedEvent {
  constructor(
    public readonly jobId: string,
    public readonly documentId: string,
    public readonly result: any,
  ) {}
}
```

### 1.3 Implement Event Publishers
```typescript
// services/event-publisher.service.ts
@Injectable()
export class EventPublisherService {
  constructor(
    @Inject('RABBITMQ_SERVICE') private readonly amqpConnection: AmqpConnection,
  ) {}

  async publishDocumentUploaded(event: DocumentUploadedEvent): Promise<void> {
    await this.amqpConnection.publish('document-events', 'document.uploaded', event);
  }

  async publishIngestionCompleted(event: IngestionCompletedEvent): Promise<void> {
    await this.amqpConnection.publish('ingestion-events', 'ingestion.completed', event);
  }
}
```

## Phase 2: Service Discovery & API Gateway

### 2.1 Add Consul for Service Discovery
```bash
# Add to docker-compose.yml
consul:
  image: consul:latest
  ports:
    - "8500:8500"
  command: agent -server -bootstrap-expect=1 -ui -client=0.0.0.0
```

### 2.2 Implement API Gateway
```typescript
// gateway/gateway.module.ts
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.TCP,
        options: { port: 3001 },
      },
      {
        name: 'DOCUMENTS_SERVICE',
        transport: Transport.TCP,
        options: { port: 3002 },
      },
      {
        name: 'INGESTION_SERVICE',
        transport: Transport.TCP,
        options: { port: 3003 },
      },
    ]),
  ],
})
export class GatewayModule {}
```

## Phase 3: Database Per Service

### 3.1 Separate Databases
```yaml
# docker-compose.yml
services:
  auth-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: auth_password

  documents-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: documents_db
      POSTGRES_USER: documents_user
      POSTGRES_PASSWORD: documents_password

  ingestion-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ingestion_db
      POSTGRES_USER: ingestion_user
      POSTGRES_PASSWORD: ingestion_password
```

### 3.2 Implement Saga Pattern for Distributed Transactions
```typescript
// sagas/document-upload-saga.ts
@Injectable()
export class DocumentUploadSaga {
  async execute(documentUploadCommand: DocumentUploadCommand): Promise<void> {
    try {
      // 1. Create document record
      const document = await this.documentsService.create(documentUploadCommand);
      
      // 2. Publish document uploaded event
      await this.eventPublisher.publishDocumentUploaded(
        new DocumentUploadedEvent(document.id, document.uploadedById, document.filePath, document.mimeType)
      );
      
      // 3. Create ingestion job
      const ingestionJob = await this.ingestionService.create({
        documentId: document.id,
        ingestionType: IngestionType.SINGLE_DOCUMENT,
      });
      
    } catch (error) {
      // Compensating actions
      await this.compensateDocumentUpload(documentUploadCommand);
    }
  }
}
```

## Phase 4: Circuit Breakers & Resilience

### 4.1 Add Circuit Breaker Pattern
```typescript
// services/circuit-breaker.service.ts
@Injectable()
export class CircuitBreakerService {
  private circuitBreaker = new CircuitBreaker(this.callExternalService, {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
  });

  async callWithCircuitBreaker<T>(serviceCall: () => Promise<T>): Promise<T> {
    return this.circuitBreaker.fire(serviceCall);
  }
}
```

### 4.2 Implement Retry Pattern
```typescript
// decorators/retry.decorator.ts
export function Retry(attempts: number = 3, delay: number = 1000) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      for (let i = 0; i < attempts; i++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          if (i === attempts - 1) throw error;
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    };
  };
}
```

## Phase 5: Observability & Monitoring

### 5.1 Add Distributed Tracing
```typescript
// tracing/tracing.module.ts
@Module({
  imports: [
    OpenTelemetryModule.forRoot({
      metrics: {
        hostMetrics: true,
        apiMetrics: {
          enable: true,
        },
      },
      traces: {
        exporters: [
          new OTLPTraceExporter({
            url: 'http://jaeger:4317',
          }),
        ],
      },
    }),
  ],
})
export class TracingModule {}
```

### 5.2 Add Health Checks
```typescript
// health/health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        auth: await this.checkAuthService(),
        documents: await this.checkDocumentsService(),
        ingestion: await this.checkIngestionService(),
      },
    };
  }
}
```

## Phase 6: Service Independence

### 6.1 Extract Services into Separate Repositories
```
doc-management/
├── api-gateway/
├── auth-service/
├── documents-service/
├── ingestion-service/
├── shared-lib/
└── docker-compose.yml
```

### 6.2 Implement Service-to-Service Communication
```typescript
// communication/service-client.service.ts
@Injectable()
export class ServiceClientService {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {}

  async callService<T>(serviceName: string, endpoint: string, data?: any): Promise<T> {
    const serviceUrl = await this.discoveryService.getServiceUrl(serviceName);
    
    return this.circuitBreaker.callWithCircuitBreaker(async () => {
      const response = await axios.post(`${serviceUrl}${endpoint}`, data);
      return response.data;
    });
  }
}
```

## Implementation Priority

### High Priority (Phase 1-2)
1. **Message Queue Integration** - Enable asynchronous communication
2. **API Gateway** - Centralized routing and authentication
3. **Service Discovery** - Dynamic service location

### Medium Priority (Phase 3-4)
1. **Database Separation** - True service independence
2. **Circuit Breakers** - Fault tolerance
3. **Event Sourcing** - Audit trail and replay capability

### Low Priority (Phase 5-6)
1. **Distributed Tracing** - Observability
2. **Service Extraction** - Physical separation
3. **Advanced Monitoring** - Performance insights

## Benefits of This Architecture

1. **Scalability**: Services can scale independently
2. **Resilience**: Circuit breakers and retry patterns
3. **Maintainability**: Clear service boundaries
4. **Technology Diversity**: Each service can use different technologies
5. **Fault Isolation**: Service failures don't cascade
6. **Independent Deployment**: Services can be deployed separately

## Migration Strategy

1. **Start with Event Bus**: Add RabbitMQ and event publishing
2. **Gradual Service Extraction**: Move services to separate containers
3. **Database Migration**: Implement saga pattern for data consistency
4. **Add Resilience**: Implement circuit breakers and retry logic
5. **Observability**: Add tracing and monitoring
6. **Full Independence**: Extract to separate repositories

This plan transforms the current monolithic-like architecture into a true microservice architecture while maintaining functionality and improving scalability, resilience, and maintainability. 