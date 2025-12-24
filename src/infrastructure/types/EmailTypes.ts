// Tipos específicos da infraestrutura de email
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Use EmailTemplateSchema from schemas for validation
export type EmailTemplate = import('../../schemas/templateSchema').EmailTemplateSchema & {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  from: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
