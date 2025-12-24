import { z } from "zod";

// Schema para categoria do rastreamento
export const trackingCategorySchema = z.enum(["sedex", "pac"], {
  message: "Category deve ser 'sedex' ou 'pac'"
});

// Schema para canal de entrega
export const deliveryChannelSchema = z.enum(["delivery", "pickup-in-point"], {
  message: "Delivery channel deve ser 'delivery' ou 'pickup-in-point'"
});

// Schema para status do rastreamento baseado nos status dos Correios
// IMPORTANTE: Manter sincronizado com o enum TrackingStatus em TrackingTypes.ts
export const trackingStatusSchema = z.enum([
  // Status iniciais
  "Etiqueta emitida",
  "Etiqueta cancelada pelo emissor",
  "Etiqueta expirada",
  "Carteiro saiu para coleta do objeto",
  "Objeto coletado",
  "Objeto postado",
  "Objeto postado após o horário limite da unidade",

  // Status de trânsito
  "Objeto em transferência - por favor aguarde",
  "Objeto em correção de rota",

  // Status de entrega
  "Objeto saiu para entrega ao destinatário",
  "Objeto saiu para entrega ao remetente",
  "Objeto aguardando retirada no endereço indicado",
  "Objeto encaminhado para retirada no endereço indicado",
  "Direcionado para entrega em unidade dos Correios a pedido do cliente",
  "Objeto entregue na Caixa de Correios Inteligente",

  // Status de não entrega
  "Objeto não entregue",
  "Objeto não entregue - endereço incorreto",
  "Objeto não entregue - endereço insuficiente",
  "Objeto não entregue - carteiro não atendido",
  "Objeto não entregue - prazo de retirada encerrado",
  "Tentativa de entrega não efetuada",

  // Status de inconsistência/informativo
  "Inconsistências no endereçamento do objeto",
  "Favor desconsiderar a informação anterior",
  "Solicitação de suspensão de entrega ao destinatário",

  // Status de erro
  "Erro na consulta",

  // Status de cancelamento/devolução
  "Saída para entrega cancelada",
  "Cancelado",
  "Devolvido",
  "Objeto será devolvido por solicitação do contratante/remetente",

  // Status de conclusão
  "Objeto entregue ao destinatário",
  "Objeto entregue ao remetente"
], {
  message: "Status deve ser um dos status válidos dos Correios"
});

// Schema para produto
export const productSchema = z.object({
  id: z.string().min(1, "ID do produto é obrigatório"),
  name: z.string().min(1, "Nome do produto é obrigatório"),
  quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1"),
  price: z.number().min(0, "Preço deve ser maior ou igual a 0")
});

// Schema para eventos de rastreamento
export const trackingEventSchema = z.object({
  date: z.string().min(1, "Data do evento é obrigatória"),
  location: z.string().min(1, "Local do evento é obrigatório"),
  status: z.string().min(1, "Status do evento é obrigatório"),
  description: z.string().min(1, "Descrição do evento é obrigatória"),
  detail: z.string().optional(),
  unitType: z.string().optional(),
  originUnit: z.string().optional(),
  destinationUnit: z.string().optional(),
  unitAddress: z.object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().optional()
  }).optional()
});

// Schema para código de rastreamento
// Formato dos Correios: 13 caracteres alfanuméricos maiúsculos (ex: AA123456789BR)
export const trackingCodeSchema = z.object({
  trackingCode: z.string()
    .length(13, "Código de rastreamento deve ter exatamente 13 caracteres")
    .regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números")
});

// Schema para atualização de rastreamento
export const updateTrackingSchema = z.object({
  order_id: z.number().int().min(100000).max(999999, "Order ID deve ter exatamente 6 dígitos").optional(),
  current_status: trackingStatusSchema.optional(),
  events: z.array(trackingEventSchema).optional(),
  name: z.string().min(1, "Nome é obrigatório").optional(),
  cpf: z.string().length(11, "CPF deve ter 11 dígitos").optional(),
  email: z.string().email("Email inválido").optional(),
  contact: z.number().int().min(1, "Número de contato deve ser válido").optional(),
  tracking_code: z
    .string()
    .length(13, "Código de rastreamento deve ter exatamente 13 caracteres")
    .regex(/^[A-Z0-9]+$/, "Código deve conter apenas letras maiúsculas e números")
    .optional(),
  category: trackingCategorySchema.optional(),
  delivery_channel: deliveryChannelSchema.optional(),
  products: z.array(productSchema).min(1, "Pelo menos um produto é obrigatório").optional(),
  quantity: z.number().int().min(1, "Quantidade deve ser pelo menos 1").optional(),
  dt_expected: z.string().datetime("Data esperada deve estar em formato ISO 8601").optional(),
  sender: z.string().min(1, "Sender é obrigatório").optional()
});

// Tipos inferidos dos schemas
export type UpdateTrackingRequest = z.infer<typeof updateTrackingSchema>;