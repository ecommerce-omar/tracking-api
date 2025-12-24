/**
 * CONFIGURAÇÃO DE EMAIL (SMTP)
 *
 * Configura o transporter do Nodemailer para envio de emails.
 * Usado pelo sistema de notificações para enviar emails aos clientes.
 *
 * Configurações suportadas:
 * - Gmail SMTP (padrão)
 * - Qualquer provedor SMTP configurado via variáveis de ambiente
 *
 * NOTA: Para Gmail, use "Senha de App" em vez da senha normal
 */
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Transporter SMTP compartilhado (singleton)
export const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.MAIL_PORT || "465"),
  secure: process.env.MAIL_SECURE === "true", // true para porta 465 (SSL), false para outras
  auth: {
    user: process.env.MAIL_USER,   // Email do remetente
    pass: process.env.MAIL_PASS,   // Senha de app (não use senha normal!)
  },
});
