import { config } from 'dotenv';
config();

import { DIContainer } from '../src/infrastructure/container/DIContainer';
import { ITrackingRepository } from '../src/domain/repositories/ITrackingRepository';
import { trackCorreios } from '../src/services/correios';

const container = DIContainer.getInstance();

async function updateAllEvents(includeDelivered: boolean = false) {
  try {
    console.log(`🚀 Iniciando atualização de eventos para ${includeDelivered ? 'todos os trackings' : 'trackings pendentes'}...\n`);

    const trackingRepository = container.getRepository<ITrackingRepository>('TrackingRepository');

    // Buscar trackings com base no parâmetro includeDelivered
    const allTrackings = includeDelivered 
      ? await trackingRepository.findAll()
      : await trackingRepository.findPendingTrackings();
    console.log(`📦 Total de trackings pendentes encontrados: ${allTrackings.length}\n`);

    let successCount = 0;
    let errorCount = 0;
    let updatedCount = 0;

    for (const tracking of allTrackings) {
      try {
        console.log(`\n📍 Processando: ${tracking.trackingCode}`);

        // Consultar API dos Correios
        const trackingData = await trackCorreios(tracking.trackingCode);

        // Atualizar eventos com os novos campos
        await trackingRepository.updateStatus(
          tracking.trackingCode,
          trackingData.status as any,
          trackingData.events,
          trackingData.dtPrevista
        );

        successCount++;
        updatedCount++;
        console.log(`   ✅ Atualizado: ${tracking.trackingCode}`);

        // Aguardar 500ms entre requisições para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error(`   ❌ Erro: ${tracking.trackingCode} - ${errorMessage}`);
      }
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('RESUMO DA ATUALIZAÇÃO');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total processados: ${allTrackings.length}`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`🔄 Atualizados: ${updatedCount}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erro crítico:', error);
    process.exit(1);
  }
}

// Pegar o argumento da linha de comando
const includeDelivered = process.argv.includes('--include-delivered');
updateAllEvents(includeDelivered);
