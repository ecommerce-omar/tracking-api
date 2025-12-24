/**
 * CONFIGURAÇÃO DO SUPABASE
 *
 * Cliente Supabase para acesso ao banco de dados PostgreSQL.
 * Utilizado por todos os repositórios para operações de persistência.
 *
 * NOTA: As variáveis de ambiente são validadas no startup pelo módulo env.ts
 */
import { createClient } from '@supabase/supabase-js';

// Variáveis de ambiente validadas no startup
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

// Cliente Supabase compartilhado (singleton)
export const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
