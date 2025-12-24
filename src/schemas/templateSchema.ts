import { z } from "zod";

// Status válidos para templates
export const validTemplateStatuses = z.enum([
  "Objeto entregue",
  "Saiu para entrega", 
  "Aguardando retirada",
  "Não entregue",
  "Saída cancelada",
  "Em transferência",
  "Postado",
  "Coletado",
  "Etiqueta emitida"
]);

// Variáveis padrão para templates
export const templateVariablesSchema = z.object({
  products: z.string().describe("lista de produtos"),
  customer_name: z.string().describe("nome do cliente"),
  tracking_code: z.string().describe("código de rastreamento"),
  status: z.string().describe("status do rastreamento")
});

// Schema para templates de email
export const emailTemplateSchema = z.object({
  name: validTemplateStatuses,
  subject: z.string().min(1, "Assunto é obrigatório"),
  body_html: z.string().min(1, "Corpo HTML é obrigatório"),
  body_text: z.string().min(1, "Corpo texto é obrigatório"),
  variables: z.record(z.string(), z.string()).default({
    "products": "{{products}}",
    "customer_name": "{{customer_name}}",
    "tracking_code": "{{tracking_code}}",
    "status": "{{status}}"
  }),
  category: z.string().min(1, "Categoria é obrigatória"),
  is_active: z.boolean().default(true)
});

// Schema para atualização de template (campos opcionais)
export const updateEmailTemplateSchema = emailTemplateSchema.partial();

// Schema para envio de email de teste
export const testEmailSchema = z.object({
  email: z.string().email("Email deve ter um formato válido")
});

// Tipos inferidos dos schemas
export type EmailTemplateSchema = z.infer<typeof emailTemplateSchema>;
export type UpdateEmailTemplateSchema = z.infer<typeof updateEmailTemplateSchema>;
export type TestEmailSchema = z.infer<typeof testEmailSchema>;
