import { TrackingEntity } from '../entities/Tracking';
import { TrackingEvent } from '../types/TrackingTypes';

export interface TrackingStatusChangedEvent {
  trackingId: string;
  trackingCode: string;
  customerName: string;
  customerEmail: string;
  products: string | string[];
  previousStatus: string;
  newStatus: string;
  deliveryChannel: string;
  timestamp: Date;
  detail?: string;
  originUnit?: string;
  destinationUnit?: string;
  unitAddress?: string;
  unitCep?: string;
}

export class TrackingStatusChangedEventEntity {
  constructor(
    public readonly trackingId: string,
    public readonly trackingCode: string,
    public readonly customerName: string,
    public readonly customerEmail: string,
    public readonly products: string | string[],
    public readonly previousStatus: string,
    public readonly newStatus: string,
    public readonly deliveryChannel: string,
    public readonly timestamp: Date = new Date(),
    public readonly detail?: string,
    public readonly originUnit?: string,
    public readonly destinationUnit?: string,
    public readonly unitAddress?: string,
    public readonly unitCep?: string
  ) {}

  static fromTracking(tracking: TrackingEntity, newStatus: string, newEvents?: TrackingEvent[]): TrackingStatusChangedEventEntity {
    // Validação: tracking deve ter ID
    if (!tracking.id) {
      throw new Error('Tracking deve ter um ID para criar evento de mudança de status');
    }

    // Pegar o último evento (mais recente) para obter detail, origem e destino
    // IMPORTANTE: Verifica se há eventos antes de acessar o primeiro elemento
    // Usa os novos eventos se disponíveis, caso contrário usa os do tracking antigo
    const latestEvents = newEvents || tracking.events;
    const lastEvent = latestEvents.length > 0 ? latestEvents[0] : null;

    // Formatar endereço completo SEMPRE que disponível, independente do status
    // Isso permite que QUALQUER template use essas variáveis se disponíveis
    let unitAddress: string | undefined;
    let unitCep: string | undefined;

    // Sempre verifica se há informações de endereço disponíveis
    // Se a API dos Correios forneceu, vamos formatar e enviar para o template
    if (lastEvent?.unitAddress) {
      const addr = lastEvent.unitAddress;
      const addressParts = [
        addr.logradouro && addr.numero ? `${addr.logradouro}, ${addr.numero}` : addr.logradouro,
        addr.bairro,
        addr.cidade && addr.uf ? `${addr.cidade} - ${addr.uf}` : (addr.cidade || addr.uf)
      ].filter(Boolean);

      unitAddress = addressParts.join('\n');
      unitCep = addr.cep;
    }

    // Formatar produtos como ARRAY para usar {{#each}} no Handlebars
    // O formato esperado do banco é: [{"id": "...", "name": "...", "price": ..., "quantity": ...}]
    let productsArray: string[] = [];
    
    try {
      if (tracking.products) {
        // Verifica se é array
        if (Array.isArray(tracking.products)) {
          if (tracking.products.length > 0) {
            productsArray = tracking.products
              .map(p => {
                // Extrai o nome do produto
                if (typeof p === 'object' && p !== null) {
                  return p.name || String(p);
                }
                return String(p);
              })
              .filter(Boolean); // Remove valores vazios
          }
        }
      }
    } catch (error) {
      console.error(`Erro ao formatar produtos:`, error);
      productsArray = ["Erro ao formatar produtos"];
    }

    return new TrackingStatusChangedEventEntity(
      tracking.id,
      tracking.trackingCode,
      tracking.name,
      tracking.email,
      productsArray.length > 0 ? productsArray : ["N/A"],
      tracking.currentStatus,
      newStatus,
      tracking.deliveryChannel,
      new Date(),
      lastEvent?.detail,
      lastEvent?.originUnit,
      lastEvent?.destinationUnit,
      unitAddress,
      unitCep
    );
  }

  toPlainObject(): TrackingStatusChangedEvent {
    return {
      trackingId: this.trackingId,
      trackingCode: this.trackingCode,
      customerName: this.customerName,
      customerEmail: this.customerEmail,
      products: this.products,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
      deliveryChannel: this.deliveryChannel,
      timestamp: this.timestamp,
      detail: this.detail,
      originUnit: this.originUnit,
      destinationUnit: this.destinationUnit,
      unitAddress: this.unitAddress,
      unitCep: this.unitCep
    };
  }
}
