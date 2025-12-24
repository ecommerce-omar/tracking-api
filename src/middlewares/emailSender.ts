import { transporter } from "../config/mail";
import { getTemplate } from "../services/templates";
import * as Handlebars from "handlebars";

type EmailVars = {
  customer_name: string;
  email: string;
  tracking_code: string;
  products: string | string[];
  status: string;
  detail?: string;
  origin_unit?: string;
  destination_unit?: string;
  unit_address?: string;
  unit_cep?: string;
};

// Mapeamento de status dos Correios para templates de email
// Nota: Status não mapeados aqui não enviarão emails (ex: entregas ao remetente, cancelamentos)
const statusTemplateMap: Record<string, string> = {
  // Status completos dos Correios - Entregas bem-sucedidas
  "Objeto entregue ao destinatário": "Objeto entregue",
  "Objeto entregue na Caixa de Correios Inteligente": "Objeto entregue",

  // Status de saída para entrega
  "Objeto saiu para entrega ao destinatário": "Saiu para entrega",
  "Objeto saiu para entrega ao remetente": "Saiu para entrega",

  // Status de retirada
  "Objeto aguardando retirada no endereço indicado": "Aguardando retirada",
  "Objeto encaminhado para retirada no endereço indicado": "Não entregue",

  // Status de não entrega (problemas diversos)
  "Objeto não entregue": "Não entregue",
  "Objeto não entregue - endereço incorreto": "Não entregue",
  "Objeto não entregue - endereço insuficiente": "Não entregue",
  "Objeto não entregue - carteiro não atendido": "Não entregue",
  "Objeto não entregue - prazo de retirada encerrado": "Não entregue",
  "Tentativa de entrega não efetuada": "Não entregue",
  "Inconsistências no endereçamento do objeto": "Não entregue",

  // Status de cancelamento
  "Saída para entrega cancelada": "Saída cancelada",

  // Status de trânsito
  "Objeto em transferência - por favor aguarde": "Em transferência",
  "Objeto em correção de rota": "Em transferência",
  "Direcionado para entrega em unidade dos Correios a pedido do cliente": "Em transferência",

  // Status de erro
  "Erro na consulta": "Postado",

  // Status iniciais
  "Objeto postado": "Postado",
  "Objeto postado após o horário limite da unidade": "Postado",
  "Objeto coletado": "Coletado",
  "Etiqueta emitida": "Etiqueta emitida",
  "Etiqueta cancelada pelo emissor": "Saída cancelada",

  // Versões curtas (retrocompatibilidade)
  "Objeto entregue": "Objeto entregue",
  "Saiu para entrega": "Saiu para entrega",
  "Aguardando retirada": "Aguardando retirada",
  "Não entregue": "Não entregue",
  "Saída cancelada": "Saída cancelada",
  "Em transferência": "Em transferência",
  "Postado": "Postado",
  "Coletado": "Coletado"

  // NOTA: Os seguintes status NÃO possuem templates (não enviam email por estarem em SILENT_STATUSES ou serem finalizados):
  // - "Objeto entregue ao remetente" (SILENT_STATUSES)
  // - "Cancelado" (finalizado)
  // - "Devolvido" (finalizado)
  // - "Etiqueta expirada" (SILENT_STATUSES)
  // - "Favor desconsiderar a informação anterior" (SILENT_STATUSES)
  // - "Objeto será devolvido por solicitação do contratante/remetente" (SILENT_STATUSES)
  // - "Solicitação de suspensão de entrega ao destinatário" (SILENT_STATUSES)
  // - "Objeto ainda não chegou à unidade" (SILENT_STATUSES)
};

export async function sendTrackingEmail(vars: EmailVars) {
  try {
    // Determina qual template usar baseado no status
    const templateName = statusTemplateMap[vars.status] || "Postado";

    // Tenta buscar o template ativo
    const template = await getTemplate(templateName);

    // Se o template não existir ou não estiver ativo, não envia o email
    if (!template || !template.is_active) {
      console.log(`[TEMPLATE DESATIVADO] Envio de email para o evento '${templateName}' está desativado. Email não enviado para ${vars.email}`);
      return;
    }

    // Prepara os dados para o Handlebars
    const templateData = {
      customer_name: vars.customer_name,
      tracking_code: vars.tracking_code,
      products: vars.products,
      status: vars.status,
      detail: vars.detail,
      origin_unit: vars.origin_unit,
      destination_unit: vars.destination_unit,
      unit_address: vars.unit_address,
      unit_cep: vars.unit_cep
    };

    // Compila e renderiza os templates com Handlebars
    const subjectTemplate = Handlebars.compile(template.subject);
    const bodyHtmlTemplate = Handlebars.compile(template.body_html);
    const bodyTextTemplate = Handlebars.compile(template.body_text);

    const subject = subjectTemplate(templateData);
    const bodyHtml = bodyHtmlTemplate(templateData);
    const bodyText = bodyTextTemplate(templateData);

    await transporter.sendMail({
      from: `"Tracking" <${process.env.MAIL_USER}>`,
      to: vars.email,
      subject: subject,
      html: bodyHtml,
      text: bodyText,
    });

    console.log(`\nEmail de ${vars.status} enviado para ${vars.email} (template: ${templateName})`);
  } catch (error) {
    console.error(`Erro ao enviar email para ${vars.email}:`, error);
    throw error;
  }
}

// Função para enviar email de teste
export async function sendTestEmail(email: string, templateName: string) {
  try {
    const template = await getTemplate(templateName);

    // Dados de teste
    const testVars = {
      customer_name: "Cliente Teste",
      email: email,
      tracking_code: "AA123456789BR",
      products: ["Produto A", "Produto B", "Produto C"],
      status: "Postado",
      detail: "Teste de detalhamento do status",
      unit_address: "Rua Exemplo, 123 - Centro",
      unit_cep: "12345-678"
    };

    // Compila e renderiza os templates com Handlebars
    const subjectTemplate = Handlebars.compile(template.subject);
    const bodyHtmlTemplate = Handlebars.compile(template.body_html);
    const bodyTextTemplate = Handlebars.compile(template.body_text);

    const subject = subjectTemplate(testVars);
    const bodyHtml = bodyHtmlTemplate(testVars);
    const bodyText = bodyTextTemplate(testVars);

    await transporter.sendMail({
      from: `"Tracking" <${process.env.MAIL_USER}>`,
      to: email,
      subject: subject,
      html: bodyHtml,
      text: bodyText,
    });

    console.log(`Email de teste enviado para ${email} usando template ${templateName}`);
  } catch (error) {
    console.error(`Erro ao enviar email de teste para ${email}:`, error);
    throw error;
  }
}
