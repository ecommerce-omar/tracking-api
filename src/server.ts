// Carrega variáveis de ambiente do arquivo .env
import dotenv from "dotenv";
dotenv.config();

// IMPORTANTE: Valida variáveis de ambiente ANTES de importar outros módulos
// que dependem delas, para falhar rapidamente se algo estiver faltando
import { validateEnv } from "./config/env";
validateEnv();

import app from "./app";
import "./jobs/trackingJob"; // Inicia job cron de rastreamento automático
import { supabase } from "./config/supabase";

const PORT = process.env.PORT || 3000;

/**
 * Testa a conexão com o banco de dados Supabase
 * @returns Promise<boolean> - true se conectado, false caso contrário
 */
async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('tracking')
      .select('count')
      .limit(1);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

// Inicializa o servidor apenas se a conexão com o banco for bem-sucedida
testSupabaseConnection().then((connected) => {
  if (connected) {
    app.listen(PORT, () => {
      console.log(`✓ API rodando na porta ${PORT}`);
      console.log(`✓ Banco de dados conectado com sucesso`);
      console.log(`✓ Job de rastreamento automático iniciado`);
    });
  } else {
    console.error("❌ Falha ao conectar com o banco de dados. Servidor não iniciado.");
    process.exit(1);
  }
});
