/**
 * SERVIÇO DE TEMPLATES DE EMAIL
 *
 * Gerencia operações CRUD para templates de email armazenados no Supabase.
 * Templates são usados para gerar emails de notificação personalizados
 * para diferentes eventos do sistema (mudança de status, etc.).
 *
 * Responsabilidades:
 * - Buscar templates por nome ou listar todos
 * - Criar novos templates no banco de dados
 * - Atualizar templates existentes
 * - Remover templates
 * - Filtrar apenas templates ativos
 *
 * Estrutura do template:
 * - name: Identificador único do template
 * - subject: Assunto do email
 * - body_html: Corpo HTML do email
 * - body_text: Versão texto do email (fallback)
 * - variables: Variáveis disponíveis para substituição
 * - category: Categoria do template (tracking, notification, etc.)
 * - is_active: Flag para ativar/desativar template
 *
 * Padrões aplicados:
 * - Service Layer Pattern
 * - Repository Pattern (implícito via Supabase)
 * - Data Access Layer
 */

import { supabase } from "../config/supabase";

/**
 * Interface que define a estrutura de um template de email
 */
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string;
  variables: Record<string, string>;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Busca um template específico pelo nome
 *
 * Retorna apenas templates ativos (is_active = true).
 *
 * @param name - Nome único do template
 * @returns Template encontrado
 * @throws Error se o template não for encontrado ou estiver inativo
 */
export async function getTemplate(name: string): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('name', name)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new Error(`Template ${name} not found`);
  }

  return data as EmailTemplate;
}

/**
 * Lista todos os templates ativos
 *
 * Retorna templates ordenados alfabeticamente por nome.
 * Filtra apenas templates com is_active = true.
 *
 * @returns Array de templates ativos
 */
export async function getAllTemplates(): Promise<EmailTemplate[]> {
  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error || !data) return [];
  return data as EmailTemplate[];
}

/**
 * Cria um novo template no banco de dados
 *
 * @param template - Dados do template (sem id, created_at e updated_at)
 * @returns Template criado com todos os campos
 * @throws Error se a criação falhar
 */
export async function createTemplate(template: Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'> & { category: string }): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .insert(template)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create template: ${error?.message}`);
  }

  return data as EmailTemplate;
}

/**
 * Atualiza um template existente
 *
 * Permite atualização parcial dos campos do template.
 *
 * @param id - ID do template a ser atualizado
 * @param template - Campos a serem atualizados (parcial)
 * @returns Template atualizado
 * @throws Error se o template não for encontrado
 */
export async function updateTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
  const { data, error } = await supabase
    .from('email_templates')
    .update(template)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Template ${id} not found`);
  }

  return data as EmailTemplate;
}

/**
 * Remove um template do banco de dados
 *
 * Executa exclusão permanente (hard delete).
 * Para desativar sem excluir, use updateTemplate com is_active: false.
 *
 * @param id - ID do template a ser removido
 * @throws Error se a exclusão falhar
 */
export async function deleteTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete template ${id}: ${error.message}`);
  }
}
