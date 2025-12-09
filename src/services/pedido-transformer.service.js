/**
 * Serviço para transformar dados de PEDIDOS do Magazord para o formato do GHL
 * Inclui informações de rastreamento e status de entrega
 */
export class PedidoTransformerService {
  /**
   * Transforma os dados de um pedido para o formato GHL
   */
  transformarPedido(dadosPedido) {
    const { pedido, pessoa, rastreamento } = dadosPedido;

    // Extrair telefone principal
    const telefone = this.extrairTelefone(pessoa);

    // Extrair itens do pedido
    const itens = this.extrairItensPedido(pedido);

    // Extrair dados de rastreamento (se existir)
    const dadosRastreamento = this.extrairRastreamento(rastreamento, pedido);

    // Determinar tipo de evento baseado na situação
    const tipoEvento = this.getTipoEvento(pedido.pedidoSituacaoId);

    // Montar estrutura final
    const estruturaFinal = {
      tipo_evento: tipoEvento,
      pedido_id: pedido.id || 0,
      pedido_codigo: pedido.codigo || '',
      
      status: {
        codigo: pedido.pedidoSituacao || pedido.pedidoSituacaoId || 0,
        descricao: pedido.pedidoSituacaoDescricao || '',
        descricao_simples: this.getDescricaoSimples(pedido.pedidoSituacao || pedido.pedidoSituacaoId),
        explicacao: this.getExplicacaoStatus(pedido.pedidoSituacao || pedido.pedidoSituacaoId),
        data_atualizacao: pedido.dataAtualizacao || pedido.dataHora || ''
      },

      pessoa: {
        nome: pessoa.nome || '',
        email: pessoa.email || '',
        telefone: telefone
      },

      pedido: {
        data_pedido: pedido.dataHora || '',
        valor_total: pedido.valorTotal || 0,
        forma_pagamento: this.extrairFormaPagamento(pedido),
        link_pagamento: pedido.linkPagamento || null,
        itens: itens
      },

      // Dados de rastreamento e entrega
      entrega: dadosRastreamento,

      origem: {
        fonte: 'magazord',
        capturado_em: new Date().toISOString(),
        identificador_unico: `MGZ-PEDIDO-${pedido.id}`
      }
    };

    return estruturaFinal;
  }

  /**
   * Extrai dados de rastreamento
   */
  extrairRastreamento(rastreamento, pedido) {
    if (!rastreamento) {
      return {
        status: 'sem_rastreamento',
        mensagem: 'Pedido ainda não foi enviado',
        
        // Flags de disponibilidade
        tem_codigo_rastreio: false,
        tem_link_rastreio: false,
        tem_transportadora: false,
        tem_previsao_entrega: false,
        
        // Endereço sempre disponível
        endereco_entrega: this.extrairEnderecoEntregaDoPedido(pedido)
      };
    }

    // Extrair dados de rastreamento
    const rastreioInfo = rastreamento.arrayPedidoRastreio?.[0] || {};
    
    const codigoRastreio = rastreioInfo.codigoRastreamento || '';
    const linkRastreio = rastreioInfo.linkRastreamento || '';
    const transportadora = rastreioInfo.transportadoraNome || '';
    const previsaoEntrega = rastreioInfo.previsaoEntrega || '';
    
    return {
      status: 'rastreavel',
      
      // Dados de rastreamento
      codigo_rastreio: codigoRastreio,
      transportadora: transportadora,
      link_rastreio: linkRastreio,
      previsao_entrega: previsaoEntrega,
      data_postagem: rastreioInfo.dataPostagem || '',
      
      // Flags de disponibilidade (para facilitar no GHL)
      tem_codigo_rastreio: !!codigoRastreio,
      tem_link_rastreio: !!linkRastreio,
      tem_transportadora: !!transportadora,
      tem_previsao_entrega: !!previsaoEntrega,
      
      // Endereço de entrega
      endereco_entrega: this.extrairEnderecoEntrega(rastreioInfo) || this.extrairEnderecoEntregaDoPedido(pedido),
      
      // Histórico de eventos de rastreamento
      eventos: this.extrairEventosRastreamento(rastreioInfo)
    };
  }

  /**
   * Extrai endereço de entrega diretamente do pedido (sempre disponível)
   */
  extrairEnderecoEntregaDoPedido(pedido) {
    return {
      destinatario: pedido.nomeDestinatario || '',
      logradouro: pedido.logradouro || '',
      numero: pedido.numero || '',
      complemento: pedido.complemento || '',
      bairro: pedido.bairro || '',
      cidade: pedido.cidadeNome || '',
      estado: pedido.estadoSigla || '',
      cep: pedido.cep || ''
    };
  }

  /**
   * Extrai endereço de entrega do rastreio
   */
  extrairEnderecoEntrega(rastreioInfo) {
    const endereco = rastreioInfo.pedidoEndereco;
    
    if (!endereco) {
      return null;
    }

    return {
      logradouro: endereco.logradouro || '',
      numero: endereco.numero || '',
      complemento: endereco.complemento || '',
      bairro: endereco.bairro || '',
      cidade: endereco.cidade || '',
      estado: endereco.estado || '',
      cep: endereco.cep || ''
    };
  }

  /**
   * Extrai eventos de rastreamento (se houver)
   */
  extrairEventosRastreamento(rastreioInfo) {
    const eventos = rastreioInfo.eventos || [];
    
    return eventos.map(evento => ({
      data: evento.data || '',
      descricao: evento.descricao || '',
      local: evento.local || ''
    }));
  }

  /**
   * Extrai o telefone principal
   */
  extrairTelefone(pessoa) {
    const contatos = pessoa.pessoaContato || [];
    
    // Priorizar celular
    const celular = contatos.find(c => c.tipoContato === 'celular' || c.tipoContato === 'telefone');
    if (celular && celular.contato) {
      return celular.contato;
    }

    // Se não houver, pegar o primeiro contato
    if (contatos.length > 0 && contatos[0].contato) {
      return contatos[0].contato;
    }

    return '';
  }

  /**
   * Extrai os itens do pedido
   */
  extrairItensPedido(pedido) {
    const itens = pedido.arrayPedidoRastreio?.[0]?.pedidoItem || [];

    return itens.map(item => ({
      produto_id: item.produtoId || 0,
      descricao: item.produtoNome || '',
      quantidade: item.quantidade || 0,
      valor_unitario: item.valorUnitario || 0,
      valor_total: item.valorTotal || 0
    }));
  }

  /**
   * Verifica se o pedido tem link de pagamento disponível
   * Útil para PIX, boletos e outros métodos que geram link
   */
  temLinkPagamento(pedido) {
    return !!pedido.linkPagamento;
  }

  /**
   * Extrai a forma de pagamento
   */
  extrairFormaPagamento(pedido) {
    const pagamentos = pedido.arrayPedidoPagamento || [];
    
    if (pagamentos.length > 0) {
      return pagamentos[0].formaPagamentoNome || 'Não informado';
    }

    return 'Não informado';
  }

  /**
   * Retorna descrição simplificada do status com explicação
   */
  getDescricaoSimples(situacaoCodigo) {
    const mapa = {
      0: 'cancelado',
      1: 'aguardando_pagamento',
      2: 'pagamento_expirado',
      3: 'pago',
      4: 'aprovado',
      5: 'em_disputa',
      6: 'devolvido',
      7: 'cancelado',
      8: 'entregue'
    };

    return mapa[situacaoCodigo] || 'desconhecido';
  }

  /**
   * Retorna explicação detalhada do status do pedido
   */
  getExplicacaoStatus(situacaoCodigo) {
    const explicacoes = {
      0: 'Pedido cancelado automaticamente pelo sistema (timeout de pagamento ou estoque indisponível)',
      1: 'Cliente finalizou o checkout mas ainda não efetuou o pagamento',
      2: 'Tempo limite para pagamento expirado (PIX/Boleto não pago no prazo)',
      3: 'Pagamento confirmado pelo gateway',
      4: 'Pedido aprovado e liberado para separação/envio',
      7: 'Pedido cancelado manualmente pelo lojista ou cliente'
    };

    return explicacoes[situacaoCodigo] || null;
  }

  /**
   * Determina o tipo de evento baseado na situação
   */
  getTipoEvento(situacaoCodigo) {
    const mapa = {
      0: 'pedido_cancelado',
      1: 'aguardando_pagamento',
      2: 'pagamento_expirado',
      3: 'pagamento_confirmado',
      4: 'pedido_aprovado',
      5: 'em_disputa',
      6: 'devolvido',
      7: 'cancelado',
      8: 'entregue'
    };

    return mapa[situacaoCodigo] || 'status_atualizado';
  }
}
