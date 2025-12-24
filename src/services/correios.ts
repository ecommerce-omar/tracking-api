import { TrackingStatus, TrackingEvent } from '../domain/types/TrackingTypes';
import { retryWithBackoff, classifyHttpError, classifyNetworkError, ErrorType, ClassifiedError } from '../shared/utils/retry';

/**
 * SERVIÇO DE INTEGRAÇÃO COM A API DOS CORREIOS
 *
 * Este arquivo contém a lógica de integração com a API oficial dos Correios
 * para consulta de rastreamento de objetos postais.
 *
 * Features:
 * - Retry automático com backoff exponencial (3 tentativas)
 * - Classificação de erros (temporários vs permanentes)
 * - Apenas erros permanentes são salvos no banco
 */

/**
 * Resposta formatada do serviço de rastreamento
 */
interface CorreiosResponse {
  status: string;           // Status atual do objeto
  events: TrackingEvent[];  // Lista de eventos de rastreamento
  dtPrevista?: string;      // Data prevista de entrega (opcional)
}

/**
 * Estrutura de resposta da API dos Correios
 * Conforme documentação oficial da API SRO Rastro v1
 */
interface CorreiosApiResponse {
  versao: string;
  quantidade: number;
  objetos: Array<{
    codObjeto: string;
    dtPrevista?: string;  // Data prevista de entrega (ISO 8601)
    mensagem?: string;    // Mensagem quando objeto não encontrado
    eventos?: Array<{
      descricao: string;      // Descrição do status (ex: "Objeto entregue ao destinatário")
      dtHrCriado: string;     // Data/hora do evento (ISO 8601)
      detalhe?: string;       // Detalhes adicionais do evento
      unidade?: {             // Unidade postal de origem
        tipo?: string;        // Ex: "Unidade de Tratamento", "Agência dos Correios"
        endereco?: {
          cep?: string;
          logradouro?: string;
          numero?: string;
          bairro?: string;
          cidade?: string;
          uf?: string;
        };
      };
      unidadeDestino?: {      // Unidade postal de destino (para transferências)
        tipo?: string;
        endereco?: {
          cidade?: string;
          uf?: string;
        };
      };
    }>;
  }>;
  tipoResultado: string;
}

import { correiosTokenService } from './correiosTokenService';

/**
 * Função interna para realizar a consulta à API dos Correios
 * (sem retry, usado internamente pela função pública)
 */
async function fetchTrackingData(code: string): Promise<CorreiosApiResponse> {
  try {
    // Obter token válido (com cache)
    const token = await correiosTokenService.getValidToken();

    // Usar o endpoint correto fornecido
    const endpoint = `https://api.correios.com.br/srorastro/v1/objetos/${code}`;

    const trackingResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'pt-BR'
      }
    });

    if (!trackingResponse.ok) {
      const errorText = await trackingResponse.text();

      // Classificar o erro baseado no status HTTP
      const classifiedError = classifyHttpError(
        trackingResponse.status,
        `Erro ao consultar rastreamento: ${trackingResponse.status} - ${errorText}`
      );

      console.error(`Erro na consulta de rastreamento (${classifiedError.type}):`, {
        status: trackingResponse.status,
        statusText: trackingResponse.statusText,
        endpoint: endpoint,
        error: errorText,
        errorType: classifiedError.type
      });

      throw classifiedError;
    }

    return await trackingResponse.json();
  } catch (error) {
    // Se for ClassifiedError, propagar
    if (error instanceof ClassifiedError) {
      throw error;
    }

    // Classificar erros de rede/timeout como temporários
    if (error instanceof Error) {
      throw classifyNetworkError(error);
    }

    throw error;
  }
}

/**
 * Consulta rastreamento na API dos Correios com retry automático
 *
 * @param code - Código de rastreamento (13 caracteres)
 * @returns Dados do rastreamento formatados
 *
 * Estratégia de retry:
 * - 3 tentativas com backoff exponencial (1s, 2s, 4s)
 * - Erros temporários: retry automático
 * - Erros permanentes: falha imediatamente (sem retry)
 */
export async function trackCorreios(code: string): Promise<CorreiosResponse> {
  try {
    // Executar com retry automático
    const trackingData = await retryWithBackoff(
      () => fetchTrackingData(code),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        backoffMultiplier: 2,
        onRetry: (attempt, error) => {
          console.log(`⚠️ Retry ${attempt}/3 para ${code}: ${error.message}`);
        }
      }
    );
    
    if (!trackingData.objetos || trackingData.objetos.length === 0) {
      throw new Error('Objeto não encontrado');
    }

    const objeto = trackingData.objetos[0];
    
    // Verificar se há mensagem de erro específica
    if (objeto.mensagem) {
      console.log('Objeto não encontrado na base dos Correios:', objeto.mensagem);
      return {
        status: "Objeto não encontrado",
        events: [{
          description: objeto.mensagem,
          date: new Date().toISOString(),
          status: 'Não encontrado',
          location: 'Correios'
        }]
      };
    }
    
    const eventos = objeto.eventos || [];

    // Se não houver eventos, retorna com status inicial
    if (eventos.length === 0) {
      console.warn(`⚠️ Objeto ${code} não possui eventos registrados`);
      return {
        status: "Etiqueta emitida",
        events: [],
        dtPrevista: objeto.dtPrevista
      };
    }

    // Converter para o formato esperado pela aplicação
    const events = eventos.map(evento => {
      let location = 'Local não informado';

      if (evento.unidade?.endereco) {
        const cidade = evento.unidade.endereco.cidade;
        const uf = evento.unidade.endereco.uf;

        if (cidade && uf) {
          location = `${cidade}/${uf}`;
        } else if (uf) {
          location = uf;
        } else if (cidade) {
          location = cidade;
        }
      }

      // Montar informações de origem e destino para transferências
      let originUnit = undefined;
      let destinationUnit = undefined;

      if (evento.unidade) {
        const partes = [evento.unidade.tipo];

        if (evento.unidade.endereco) {
          if (evento.unidade.endereco.cidade && evento.unidade.endereco.uf) {
            partes.push(`${evento.unidade.endereco.cidade} - ${evento.unidade.endereco.uf}`);
          } else if (evento.unidade.endereco.cidade) {
            partes.push(evento.unidade.endereco.cidade);
          } else if (evento.unidade.endereco.uf) {
            partes.push(evento.unidade.endereco.uf);
          }
        }

        originUnit = partes.filter(Boolean).join(', ');
      }

      if (evento.unidadeDestino) {
        const partes = [evento.unidadeDestino.tipo];

        if (evento.unidadeDestino.endereco) {
          if (evento.unidadeDestino.endereco.cidade && evento.unidadeDestino.endereco.uf) {
            partes.push(`${evento.unidadeDestino.endereco.cidade} - ${evento.unidadeDestino.endereco.uf}`);
          } else if (evento.unidadeDestino.endereco.cidade) {
            partes.push(evento.unidadeDestino.endereco.cidade);
          } else if (evento.unidadeDestino.endereco.uf) {
            partes.push(evento.unidadeDestino.endereco.uf);
          }
        }

        destinationUnit = partes.filter(Boolean).join(', ');
      }

      return {
        description: evento.descricao,
        date: evento.dtHrCriado,
        status: evento.descricao,
        location,
        detail: evento.detalhe,
        unitType: evento.unidade?.tipo,
        originUnit,
        destinationUnit,
        unitAddress: evento.unidade?.endereco ? {
          cep: evento.unidade.endereco.cep,
          logradouro: evento.unidade.endereco.logradouro,
          numero: evento.unidade.endereco.numero,
          bairro: evento.unidade.endereco.bairro,
          cidade: evento.unidade.endereco.cidade,
          uf: evento.unidade.endereco.uf
        } : undefined
      };
    });

    // Determinar status atual baseado no último evento
    // IMPORTANTE: Verificações ordenadas do mais específico ao mais genérico
    // para evitar que termos genéricos capturem casos específicos
    const lastEvent = events[0];
    let status = 'Objeto em transferência - por favor aguarde'; // Status padrão

    if (lastEvent) {
      const description = lastEvent.description;

      // Status de entrega (mais específicos primeiro)
      if (description.includes('Objeto entregue ao destinatário')) {
        status = 'Objeto entregue ao destinatário';
      } else if (description.includes('Objeto entregue ao remetente')) {
        status = 'Objeto entregue ao remetente';
      } else if (description.includes('Objeto entregue na Caixa de Correios Inteligente')) {
        status = 'Objeto entregue na Caixa de Correios Inteligente';
      }

      // Status de não entrega (específicos)
      else if (description.includes('Objeto não entregue - prazo de retirada encerrado')) {
        status = 'Objeto não entregue - prazo de retirada encerrado';
      } else if (description.includes('Objeto não entregue - carteiro não atendido')) {
        status = 'Objeto não entregue - carteiro não atendido';
      } else if (description.includes('Objeto não entregue - endereço insuficiente')) {
        status = 'Objeto não entregue - endereço insuficiente';
      } else if (description.includes('Objeto não entregue - endereço incorreto')) {
        status = 'Objeto não entregue - endereço incorreto';
      } else if (description.includes('Tentativa de entrega não efetuada')) {
        status = 'Tentativa de entrega não efetuada';
      } else if (description.includes('Objeto não entregue')) {
        status = 'Objeto não entregue';
      }

      // Status de saída para entrega
      else if (description.includes('Objeto saiu para entrega ao destinatário')) {
        status = 'Objeto saiu para entrega ao destinatário';
      } else if (description.includes('Objeto saiu para entrega ao remetente')) {
        status = 'Objeto saiu para entrega ao remetente';
      } else if (description.includes('Saída para entrega cancelada')) {
        status = 'Saída para entrega cancelada';
      }

      // Status de retirada
      else if (description.includes('Objeto encaminhado para retirada no endereço indicado')) {
        status = 'Objeto encaminhado para retirada no endereço indicado';
      } else if (description.includes('Objeto aguardando retirada no endereço indicado')) {
        status = 'Objeto aguardando retirada no endereço indicado';
      }

      // Status de direcionamento
      else if (description.includes('Direcionado para entrega em unidade dos Correios a pedido do cliente')) {
        status = 'Direcionado para entrega em unidade dos Correios a pedido do cliente';
      }

      // Status de trânsito (verificar "correção de rota" antes de "transferência" genérico)
      else if (description.includes('Objeto em correção de rota')) {
        status = 'Objeto em correção de rota';
      } else if (description.includes('Objeto ainda não chegou à unidade')) {
        status = 'Objeto ainda não chegou à unidade';
      } else if (description.includes('Objeto em transferência')) {
        status = 'Objeto em transferência - por favor aguarde';
      }

      // Status iniciais
      else if (description.includes('Objeto postado após o horário limite da unidade')) {
        status = 'Objeto postado após o horário limite da unidade';
      } else if (description.includes('Objeto postado')) {
        status = 'Objeto postado';
      } else if (description.includes('Objeto coletado')) {
        status = 'Objeto coletado';
      } else if (description.includes('Carteiro saiu para coleta do objeto')) {
        status = 'Carteiro saiu para coleta do objeto';
      } else if (description.includes('Etiqueta cancelada pelo emissor')) {
        status = 'Etiqueta cancelada pelo emissor';
      } else if (description.includes('Etiqueta expirada')) {
        status = 'Etiqueta expirada';
      } else if (description.includes('Etiqueta emitida')) {
        status = 'Etiqueta emitida';
      }

      // Status de inconsistência/informativo
      else if (description.includes('Inconsistências no endereçamento do objeto')) {
        status = 'Inconsistências no endereçamento do objeto';
      } else if (description.includes('Favor desconsiderar a informação anterior')) {
        status = 'Favor desconsiderar a informação anterior';
      } else if (description.includes('Solicitação de suspensão de entrega ao destinatário')) {
        status = 'Solicitação de suspensão de entrega ao destinatário';
      }

      // Outros status
      else if (description.includes('Objeto será devolvido por solicitação do contratante/remetente')) {
        status = 'Objeto será devolvido por solicitação do contratante/remetente';
      } else if (description.includes('Cancelado')) {
        status = 'Cancelado';
      } else if (description.includes('Devolvido')) {
        status = 'Devolvido';
      }

      // Se nenhum match, loga warning para investigação
      else {
        console.warn(`⚠️ Status desconhecido detectado dos Correios: "${description}"`);
        console.warn(`   Código de rastreamento: ${code}`);
      }
    }

    return {
      status,
      events,
      dtPrevista: objeto.dtPrevista
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Determinar se é erro temporário ou permanente
    const isTemporary = error instanceof ClassifiedError && error.type === ErrorType.TEMPORARY;
    const isPermanent = error instanceof ClassifiedError && error.type === ErrorType.PERMANENT;

    // Log detalhado do erro
    console.error(`Erro ao consultar Correios (${isTemporary ? 'TEMPORÁRIO' : isPermanent ? 'PERMANENTE' : 'DESCONHECIDO'}):`, {
      error: errorMessage,
      code,
      errorType: error instanceof ClassifiedError ? error.type : 'unknown',
      timestamp: new Date().toISOString(),
      stack: errorStack
    });

    // ERROS TEMPORÁRIOS: Re-lançar para que o job possa SKIP sem salvar no banco
    if (isTemporary) {
      throw error;
    }

    // ERROS PERMANENTES: Retornar dados com status de erro para salvar no banco
    // (código inválido, não encontrado, etc.)
    return {
      status: "Erro na consulta",
      events: [{
        description: `Erro ao consultar os Correios: ${errorMessage}. Verifique o código de rastreamento.`,
        date: new Date().toISOString(),
        status: 'Erro',
        location: 'Sistema'
      }]
    };
  }
}