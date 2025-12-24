import { config } from 'dotenv';
config();

async function testCorreios() {
  try {
    const apiKey = process.env.CORREIOS_API_KEY;
    const username = process.env.CORREIOS_USERNAME;
    const postalCard = process.env.CORREIOS_POSTAL_CARD;

    if (!apiKey || !username || !postalCard) {
      console.error('Credenciais não configuradas');
      return;
    }

    const basicAuth = Buffer.from(`${username}:${apiKey}`).toString('base64');

    console.log('🔑 Gerando token...\n');
    const tokenResponse = await fetch('https://api.correios.com.br/token/v1/autentica/cartaopostagem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${basicAuth}`
      },
      body: JSON.stringify({ numero: postalCard })
    });

    if (!tokenResponse.ok) {
      console.log('❌ Status:', tokenResponse.status);
      const text = await tokenResponse.text();
      console.log('Erro:', text);
      return;
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.token;

    console.log('✅ Token obtido com sucesso\n');

    // Testar código AN018712369BR
    console.log('📦 Consultando código AN018712369BR...\n');
    const trackingResponse = await fetch('https://api.correios.com.br/srorastro/v1/objetos/AN018712369BR', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'pt-BR'
      }
    });

    if (!trackingResponse.ok) {
      console.log('❌ Status:', trackingResponse.status);
      const text = await trackingResponse.text();
      console.log('Erro:', text);
      return;
    }

    const data = await trackingResponse.json();

    console.log('═══════════════════════════════════════════════════════');
    console.log('RESPOSTA COMPLETA DA API');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log(JSON.stringify(data, null, 2));

    if (data.objetos?.[0]?.eventos) {
      const eventos = data.objetos[0].eventos;

      console.log('\n═══════════════════════════════════════════════════════');
      console.log(`TOTAL DE EVENTOS: ${eventos.length}`);
      console.log('═══════════════════════════════════════════════════════\n');

      console.log('🔍 PRIMEIRO EVENTO (mais recente):');
      console.log(JSON.stringify(eventos[0], null, 2));

      console.log('\n🔍 ÚLTIMO EVENTO (mais antigo):');
      console.log(JSON.stringify(eventos[eventos.length - 1], null, 2));

      console.log('\n═══════════════════════════════════════════════════════');
      console.log('VERIFICAÇÃO DE CAMPOS');
      console.log('═══════════════════════════════════════════════════════\n');

      const primeiroEvento = eventos[0];
      console.log('✓ Campos disponíveis no evento:', Object.keys(primeiroEvento));
      console.log('✓ Tem unidadeDestino?', !!primeiroEvento.unidadeDestino);
      console.log('✓ Tem detalhe?', !!primeiroEvento.detalhe);
      console.log('✓ Descrição:', primeiroEvento.descricao);

      if (primeiroEvento.unidade) {
        console.log('✓ Unidade tipo:', primeiroEvento.unidade.tipo);
        console.log('✓ Unidade nome:', primeiroEvento.unidade.nome);
        console.log('✓ Unidade cidade:', primeiroEvento.unidade.endereco?.cidade);
        console.log('✓ Unidade UF:', primeiroEvento.unidade.endereco?.uf);
      }
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testCorreios();
