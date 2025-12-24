import { supabase } from '../../config/supabase';
import { ITrackingRepository } from '../../domain/repositories/ITrackingRepository';
import { TrackingEntity } from '../../domain/entities/Tracking';
import { TrackingCategory, TrackingStatus, TrackingEvent, TrackingData } from '../../domain/types/TrackingTypes';

/**
 * Repositório de Rastreamento - Implementação com Supabase
 *
 * Responsável por todas as operações de persistência de rastreamentos.
 * Implementa a interface ITrackingRepository seguindo o padrão Repository.
 */
export class DatabaseTrackingRepository implements ITrackingRepository {
  async findById(id: string): Promise<TrackingEntity | null> {
    try {
      const { data, error } = await supabase
        .from('tracking')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) return null;
      return TrackingEntity.create(data as TrackingData);
    } catch (error) {
      console.error('Error finding tracking by id:', error);
      return null;
    }
  }

  async findByTrackingCode(trackingCode: string): Promise<TrackingEntity | null> {
    try {
      const { data, error } = await supabase
        .from('tracking')
        .select('*')
        .eq('tracking_code', trackingCode)
        .single();

      if (error || !data) return null;
      return TrackingEntity.create(data as TrackingData);
    } catch (error) {
      console.error('Error finding tracking by tracking code:', error);
      return null;
    }
  }

  async findAll(): Promise<TrackingEntity[]> {
    const { data, error } = await supabase
      .from('tracking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(tracking => TrackingEntity.create(tracking as TrackingData));
  }

  async findByCategory(category: TrackingCategory): Promise<TrackingEntity[]> {
    const { data, error } = await supabase
      .from('tracking')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data.map(tracking => TrackingEntity.create(tracking as TrackingData));
  }

  /**
   * Busca todos os rastreamentos pendentes (não finalizados)
   *
   * Rastreamentos pendentes são aqueles que ainda não foram entregues
   * e precisam ser consultados periodicamente na API dos Correios.
   *
   * @returns Lista de rastreamentos pendentes
   */
  async findPendingTrackings(): Promise<TrackingEntity[]> {
    // Define todos os status possíveis que consideramos "em andamento"
    // Exclui apenas os status de conclusão: entregues, cancelados e devolvidos
    const pendingStatuses = [
      // Status iniciais
      'Etiqueta emitida',
      'Carteiro saiu para coleta do objeto',
      'Objeto postado',
      'Objeto postado após o horário limite da unidade',
      'Objeto coletado',

      // Status de movimentação
      'Objeto em transferência - por favor aguarde',
      'Objeto em correção de rota',
      'Objeto ainda não chegou à unidade',
      'Objeto saiu para entrega ao destinatário',
      'Objeto saiu para entrega ao remetente',

      // Status de retirada
      'Objeto aguardando retirada no endereço indicado',
      'Objeto encaminhado para retirada no endereço indicado',
      'Direcionado para entrega em unidade dos Correios a pedido do cliente',

      // Status de não entrega (tentativas)
      'Objeto não entregue',
      'Objeto não entregue - endereço incorreto',
      'Objeto não entregue - endereço insuficiente',
      'Objeto não entregue - carteiro não atendido',
      'Objeto não entregue - prazo de retirada encerrado',
      'Tentativa de entrega não efetuada',
      'Saída para entrega cancelada',

      // Status de inconsistência/informativo
      'Inconsistências no endereçamento do objeto',
      'Favor desconsiderar a informação anterior',
      'Solicitação de suspensão de entrega ao destinatário',

      // Status de devolução em andamento
      'Objeto será devolvido por solicitação do contratante/remetente',

      // Status de erro (permite retry de objetos com erro temporário/código inválido)
      'Erro na consulta'
    ];
    
    // Busca apenas os objetos com status pendentes
    const query = supabase
      .from('tracking')
      .select('*')
      .not('tracking_code', 'is', null)
      .not('current_status', 'is', null)
      .in('current_status', pendingStatuses)
      .order('updated_at', { ascending: false }); // Ordena por data de atualização

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar trackings pendentes:', error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(tracking => TrackingEntity.create(tracking as TrackingData));
  }

  async updateStatus(trackingCode: string, status: TrackingStatus, events: TrackingEvent[], dtExpected?: string): Promise<TrackingEntity> {
    const updatedAt = new Date().toISOString();

    // Interface para dados de atualização
    interface UpdateTrackingData {
      current_status: TrackingStatus;
      events: TrackingEvent[];
      updated_at: string;
      dt_expected?: string;
    }

    const updateData: UpdateTrackingData = {
      current_status: status,
      events: events,
      updated_at: updatedAt
    };

    // Adiciona data prevista apenas se fornecida
    if (dtExpected) {
      updateData.dt_expected = dtExpected;
    }

    const { data, error } = await supabase
      .from('tracking')
      .update(updateData)
      .eq('tracking_code', trackingCode)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Tracking with tracking code ${trackingCode} not found`);
    }

    return TrackingEntity.create(data as TrackingData);
  }
}
