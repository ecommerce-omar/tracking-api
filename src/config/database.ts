import postgres from 'postgres';

// Configuração da conexão direta com PostgreSQL
const connectionString = process.env.DATABASE_URL!;

export const sql = postgres(connectionString);

// Função para testar a conexão
export async function testConnection() {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    console.log('Conexão com banco de dados estabelecida:', result[0]);
    return true;
  } catch (error) {
    console.error('Erro ao conectar com o banco de dados:', error);
    return false;
  }
}

export default sql;
