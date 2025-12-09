/**
 * Serviço para transformar dados do Magazord para o formato do GHL
 */
export class TransformerService {
  /**
   * Transforma os dados brutos do Magazord no formato esperado pelo GHL
   */
  transformarDados(carrinhoId, dadosMagazord) {
    const { carrinho, pedido, pessoa } = dadosMagazord;

    // Extrair endereço principal
    const enderecoEntrega = this.extrairEndereco(pessoa, pedido);

    // Extrair telefone principal
    const telefone = this.extrairTelefone(pessoa);

    // Extrair itens do pedido
    const itens = this.extrairItensPedido(pedido);

    // Montar estrutura final
    const estruturaFinal = {
      pedido_id: pedido.id || 0,
      carrinho_id: carrinhoId,
      
      status_carrinho: {
        codigo: carrinho.status || 0,
        descricao_simples: this.getDescricaoCarrinho(carrinho.status),
        explicacao: this.getExplicacaoCarrinho(carrinho.status)
      },

      pessoa: {
        nome: pessoa.nome || '',
        email: pessoa.email || '',
        telefone: telefone
        // ENDEREÇO REMOVIDO - sempre vazio no Magazord
      },

      pedido: {
        data_pedido: pedido.dataHora || '',
        valor_total: pedido.valorTotal || 0,
        forma_pagamento: this.extrairFormaPagamento(pedido),
        status_pedido: pedido.pedidoSituacaoDescricao || '',
        itens: itens
      },

      origem: {
        fonte: 'magazord',
        capturado_em: new Date().toISOString(),
        identificador_unico: `MGZ-${carrinhoId}-${pedido.id}` // Para controle de duplicatas no GHL
      }
    };

    return estruturaFinal;
  }

  /**
   * Extrai o endereço de entrega
   */
  extrairEndereco(pessoa, pedido) {
    // Tentar pegar do endereço de entrega do pedido primeiro
    const enderecoEntrega = pedido.arrayPedidoRastreio?.[0]?.pedidoEndereco;
    
    if (enderecoEntrega) {
      return {
        logradouro: enderecoEntrega.logradouro || '',
        numero: enderecoEntrega.numero || '',
        bairro: enderecoEntrega.bairro || '',
        cidade: enderecoEntrega.cidade || '',
        estado: enderecoEntrega.estado || '',
        cep: enderecoEntrega.cep || ''
      };
    }

    // Se não houver, tentar do endereço da pessoa
    const enderecoPessoa = pessoa.pessoaEndereco?.[0];
    if (enderecoPessoa) {
      return {
        logradouro: enderecoPessoa.logradouro || '',
        numero: enderecoPessoa.numero || '',
        bairro: enderecoPessoa.bairro || '',
        cidade: enderecoPessoa.cidade || '',
        estado: enderecoPessoa.estado || '',
        cep: enderecoPessoa.cep || ''
      };
    }

    // Retornar vazio se não houver endereço
    return {
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    };
  }

  /**
   * Extrai o telefone principal
   */
  extrairTelefone(pessoa) {
    const contatos = pessoa.pessoaContato || [];
    
    // Priorizar celular
    const celular = contatos.find(c => c.tipoContato === 'celular' || c.tipoContato === 'telefone');
    if (celular) {
      return celular.contato || '';
    }

    // Se não houver, pegar o primeiro contato
    if (contatos.length > 0) {
      return contatos[0].contato || '';
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
   * Retorna descrição simplificada do status do carrinho
   */
  getDescricaoCarrinho(statusCodigo) {
    const mapa = {
      1: 'aberto',
      2: 'abandonado',
      3: 'pedido_feito'
    };

    return mapa[statusCodigo] || 'desconhecido';
  }

  /**
   * Retorna explicação do status do carrinho
   */
  getExplicacaoCarrinho(statusCodigo) {
    const explicacoes = {
      1: 'Cliente adicionou produtos ao carrinho mas ainda não foi para o checkout',
      2: 'Cliente finalizou o checkout mas não completou o pagamento no prazo (carrinho abandonado)',
      3: 'Cliente completou o checkout e o pedido foi confirmado'
    };

    return explicacoes[statusCodigo] || null;
  }
}
