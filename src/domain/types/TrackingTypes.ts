/**
 * TIPOS DO DOMÍNIO - TRACKING
 *
 * Este arquivo define os tipos fundamentais do domínio de rastreamento de pedidos.
 * Mantém a estrutura de dados consistente em toda a aplicação.
 */

/**
 * Representa um produto no pedido
 */
export interface Product {
  id: string;
  name: string;
  quantity: number; // Quantidade do produto
  price: number;    // Preço unitário
}

/**
 * Dados completos de um rastreamento
 * Representa toda a informação necessária para rastrear um pedido
 */
export interface TrackingData {
  id?: string;
  order_id: number;
  name: string;
  cpf: string;
  email: string;
  contact?: number;
  tracking_code: string;
  current_status: TrackingStatus;
  category: TrackingCategory;
  delivery_channel: DeliveryChannel;
  products: Product[];
  quantity: number;
  events: TrackingEvent[];
  created_at?: string;
  updated_at?: string;
  dt_expected?: string;
  sender?: string;
}

/**
 * Evento de rastreamento retornado pelos Correios
 * Cada evento representa uma atualização no status do objeto postal
 */
export interface TrackingEvent {
  date: string;             // Data/hora do evento em formato ISO
  location: string;         // Local onde ocorreu o evento (ex: "São Paulo/SP")
  status: string;           // Status do evento (cópia da description)
  description: string;      // Descrição completa do status
  detail?: string;          // Detalhe adicional - Ex: "Aguardando postagem pelo remetente"
  unitType?: string;        // Tipo da unidade - Ex: "Unidade de Tratamento", "Agência dos Correios"
  originUnit?: string;      // Unidade de origem (para transferências) - Ex: "Unidade de Tratamento, CURITIBA - PR"
  destinationUnit?: string; // Unidade de destino (para transferências) - Ex: "Unidade de Tratamento, BELO HORIZONTE - MG"
  unitAddress?: {           // Endereço completo da unidade (quando disponível)
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
  };
}

/**
 * Enum de Status de Rastreamento
 *
 * Todos os status possíveis dos Correios mapeados no sistema.
 * IMPORTANTE: Manter sincronizado com trackingSchema.ts
 */
export enum TrackingStatus {
  // Status iniciais
  ETIQUETA_EMITIDA = "Etiqueta emitida",
  ETIQUETA_CANCELADA = "Etiqueta cancelada pelo emissor",
  ETIQUETA_EXPIRADA = "Etiqueta expirada",
  CARTEIRO_SAIU_COLETA = "Carteiro saiu para coleta do objeto",
  OBJETO_COLETADO = "Objeto coletado",
  POSTADO = "Objeto postado",
  POSTADO_APOS_HORARIO_LIMITE = "Objeto postado após o horário limite da unidade",

  // Status de trânsito
  EM_TRANSITO = "Objeto em transferência - por favor aguarde",
  CORRECAO_ROTA = "Objeto em correção de rota",
  OBJETO_NAO_CHEGOU_UNIDADE = "Objeto ainda não chegou à unidade",

  // Status de saída para entrega
  SAIU_PARA_ENTREGA = "Objeto saiu para entrega ao destinatário",
  SAIU_PARA_ENTREGA_REMETENTE = "Objeto saiu para entrega ao remetente",

  // Status de retirada
  AGUARDANDO_RETIRADA = "Objeto aguardando retirada no endereço indicado",
  ENCAMINHADO_RETIRADA = "Objeto encaminhado para retirada no endereço indicado",
  DIRECIONADO_UNIDADE = "Direcionado para entrega em unidade dos Correios a pedido do cliente",

  // Status de não entrega (problemas)
  NAO_ENTREGUE = "Objeto não entregue",
  NAO_ENTREGUE_ENDERECO_INCORRETO = "Objeto não entregue - endereço incorreto",
  NAO_ENTREGUE_ENDERECO_INSUFICIENTE = "Objeto não entregue - endereço insuficiente",
  NAO_ENTREGUE_CARTEIRO_NAO_ATENDIDO = "Objeto não entregue - carteiro não atendido",
  NAO_ENTREGUE_PRAZO_ENCERRADO = "Objeto não entregue - prazo de retirada encerrado",
  TENTATIVA_ENTREGA_NAO_EFETUADA = "Tentativa de entrega não efetuada",

  // Status de inconsistência/informativo
  INCONSISTENCIAS_ENDERECAMENTO = "Inconsistências no endereçamento do objeto",
  DESCONSIDERAR_INFORMACAO = "Favor desconsiderar a informação anterior",
  SUSPENSAO_ENTREGA = "Solicitação de suspensão de entrega ao destinatário",

  // Status de erro (problemas ao consultar API dos Correios)
  ERRO_CONSULTA = "Erro na consulta",

  // Status de cancelamento
  ENTREGA_CANCELADA = "Saída para entrega cancelada",
  CANCELADO = "Cancelado",
  DEVOLVIDO = "Devolvido",
  OBJETO_SERA_DEVOLVIDO = "Objeto será devolvido por solicitação do contratante/remetente",

  // Status de conclusão (entrega bem-sucedida)
  ENTREGUE = "Objeto entregue ao destinatário",
  ENTREGUE_REMETENTE = "Objeto entregue ao remetente",
  ENTREGUE_CAIXA_INTELIGENTE = "Objeto entregue na Caixa de Correios Inteligente"
}

/**
 * Categoria de serviço dos Correios
 */
export enum TrackingCategory {
  SEDEX = "sedex",  // Entrega expressa
  PAC = "pac"       // Entrega econômica
}

/**
 * Canal de entrega do pedido
 */
export enum DeliveryChannel {
  DELIVERY = "delivery",              // Entrega em domicílio
  PICKUP_IN_POINT = "pickup-in-point" // Retirada em ponto de coleta
}

// Value Objects - Objetos de valor do domínio (implementados como classes)
export { TrackingCode } from '../value-objects/TrackingCode';
export { CustomerCPF } from '../value-objects/CustomerCPF';
