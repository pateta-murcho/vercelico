import axios from 'axios';

/**
 * Serviço para interagir com pedidos e rastreamento do Magazord
 */
export class PedidoService {
  constructor() {
    this.baseUrl = 'https://danajalecos.painel.magazord.com.br/api/v2/site';
    this.username = 'MZDKe610ed8d77404c8ebe37b79a35b579a5e4e85682c15d6bd89f30d5852757';
    this.password = 'o#W51myRIS@j';
    this.auth = {
      username: this.username,
      password: this.password
    };
  }

  /**
   * Busca pedidos por situação/status
   * Situações disponíveis:
   * 0 = Cancelado
   * 1 = Aguardando Pagamento
   * 2 = Em análise
   * 3 = Pago
   * 4 = Aprovado
   * 5 = Em disputa
   * 6 = Devolvido
   * 7 = Cancelado
   * 8 = Entregue
   */
  async listarPedidosPorSituacao(situacoes = [1, 3, 4], diasAtras = 7) {
    try {
      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - diasAtras);

      const formatarData = (data) => {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, '0');
        const min = String(data.getMinutes()).padStart(2, '0');
        const seg = String(data.getSeconds()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
      };

      console.log(`Buscando pedidos com situações [${situacoes.join(', ')}]...`);

      const response = await axios.get(`${this.baseUrl}/pedido`, {
        params: {
          limit: 100,
          page: 1,
          orderDirection: 'desc',
          situacao: situacoes.join(','),
          dataHoraInicio: formatarData(dataInicio),
          dataHoraFim: formatarData(dataFim)
        },
        auth: this.auth
      });

      const pedidos = response.data?.data?.items || [];
      console.log(`✅ Encontrados ${pedidos.length} pedidos`);

      return pedidos;
    } catch (error) {
      console.error('❌ Erro ao listar pedidos:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Erro ao listar pedidos: ${error.message}`);
    }
  }

  /**
   * Consulta pedido específico por código
   */
  async getPedido(codigoPedido) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/pedido/${codigoPedido}`,
        { auth: this.auth }
      );

      return response.data?.data || null;
    } catch (error) {
      console.error(`Erro ao consultar pedido ${codigoPedido}:`, error.message);
      throw new Error(`Erro ao buscar pedido ${codigoPedido}: ${error.message}`);
    }
  }

  /**
   * Consulta informações de rastreamento do pedido
   */
  async getRastreamento(codigoPedido) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/pedido/${codigoPedido}/rastreio`,
        { auth: this.auth }
      );

      return response.data?.data || null;
    } catch (error) {
      console.error(`Erro ao consultar rastreamento do pedido ${codigoPedido}:`, error.message);
      // Não lançar erro se não houver rastreamento ainda
      return null;
    }
  }

  /**
   * Consulta pessoa pelo ID
   */
  async getPessoa(pessoaId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/pessoa/${pessoaId}`,
        {
          params: {
            listaContatos: 1,
            listaEnderecos: 1
          },
          auth: this.auth
        }
      );

      return response.data?.data || null;
    } catch (error) {
      console.error(`Erro ao consultar pessoa ${pessoaId}:`, error.message);
      throw new Error(`Erro ao buscar pessoa ${pessoaId}: ${error.message}`);
    }
  }

  /**
   * Coleta dados completos do pedido incluindo rastreamento e pessoa
   */
  async coletarDadosCompletosPedido(codigoPedido) {
    try {
      console.log(`Coletando dados completos do pedido ${codigoPedido}...`);

      // 1. Buscar pedido
      const pedido = await this.getPedido(codigoPedido);
      if (!pedido) {
        throw new Error(`Pedido ${codigoPedido} não encontrado`);
      }

      // 2. Buscar pessoa
      const pessoaId = pedido.pessoaId;
      if (!pessoaId) {
        throw new Error(`Pedido ${codigoPedido} não possui pessoa associada`);
      }

      const pessoa = await this.getPessoa(pessoaId);
      if (!pessoa) {
        throw new Error(`Pessoa ${pessoaId} não encontrada`);
      }

      // 3. VALIDAÇÃO: Verificar se tem email OU telefone
      const email = pessoa.email || '';
      const telefone = this.extrairTelefone(pessoa);
      
      if (!email && !telefone) {
        throw new Error(`Pedido ${codigoPedido} - Pessoa ${pessoaId} não possui email nem telefone (obrigatório para GHL)`);
      }

      // 4. Buscar rastreamento (opcional - pode não existir ainda)
      const rastreamento = await this.getRastreamento(codigoPedido);

      console.log(`✅ Dados completos coletados para pedido ${codigoPedido}`);

      return {
        pedido,
        pessoa,
        rastreamento
      };
    } catch (error) {
      console.error(`❌ Erro ao coletar dados do pedido:`, error.message);
      throw error;
    }
  }

  /**
   * Extrai o telefone principal da pessoa
   */
  extrairTelefone(pessoa) {
    const contatos = pessoa.pessoaContato || [];
    
    // Priorizar celular
    const celular = contatos.find(c => c.tipoContato === 'celular' || c.tipoContato === 'telefone');
    if (celular && celular.contato) {
      return celular.contato;
    }

    // Se não houver, pegar o primeiro contato que não esteja vazio
    if (contatos.length > 0 && contatos[0].contato) {
      return contatos[0].contato;
    }

    return '';
  }

  /**
   * Mapeia código de situação para descrição amigável
   */
  getSituacaoDescricao(situacaoCodigo) {
    const mapa = {
      0: 'Cancelado',
      1: 'Aguardando Pagamento',
      2: 'Em Análise',
      3: 'Pago',
      4: 'Aprovado',
      5: 'Em Disputa',
      6: 'Devolvido',
      7: 'Cancelado',
      8: 'Entregue'
    };

    return mapa[situacaoCodigo] || `Situação ${situacaoCodigo}`;
  }

  /**
   * Determina o tipo de evento baseado na situação
   */
  getTipoEvento(situacaoCodigo) {
    const mapa = {
      1: 'aguardando_pagamento',
      2: 'em_analise',
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
