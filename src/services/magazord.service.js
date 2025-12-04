import axios from 'axios';

/**
 * Serviço para interagir com a API Magazord
 */
export class MagazordService {
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
   * Consulta carrinho específico por ID
   * Nota: A API não suporta GET /carrinho/{id}, então buscamos via lista
   */
  async getCarrinho(carrinhoId) {
    try {
      // Buscar via listagem com filtro
      const response = await axios.get(`${this.baseUrl}/carrinho`, {
        params: {
          limit: 1,
          page: 1,
          id: carrinhoId
        },
        auth: this.auth
      });

      const carrinhos = response.data?.data?.items || [];
      if (carrinhos.length > 0) {
        return carrinhos[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Erro ao consultar carrinho ${carrinhoId}:`, error.message);
      throw new Error(`Erro ao buscar carrinho ${carrinhoId}: ${error.message}`);
    }
  }

  /**
   * Consulta pedido pelo código
   */
  async getPedido(codigoPedido) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/pedido/${codigoPedido}`,
        {
          params: { listaContatos: 1 },
          auth: this.auth
        }
      );

      return response.data?.data || null;
    } catch (error) {
      console.error(`Erro ao consultar pedido ${codigoPedido}:`, error.message);
      throw new Error(`Erro ao buscar pedido ${codigoPedido}: ${error.message}`);
    }
  }

  /**
   * Consulta pessoa por ID
   */
  async getPessoa(pessoaId) {
    try {
      const response = await axios.get(`${this.baseUrl}/pessoa/${pessoaId}`, {
        auth: this.auth
      });

      return response.data?.data || null;
    } catch (error) {
      console.error(`Erro ao consultar pessoa ${pessoaId}:`, error.message);
      throw new Error(`Erro ao buscar pessoa ${pessoaId}: ${error.message}`);
    }
  }

  /**
   * Busca lista de carrinhos com status 2 ou 3 (convertidos)
   * LIMITAÇÃO DA API: Máximo 30 dias por requisição!
   * Para períodos maiores, faz múltiplas requisições
   */
  async listarCarrinhos(limit = 100, diasAtras = 180) {
    try {
      console.log(`Buscando carrinhos dos últimos ${diasAtras} dias com status 2 ou 3...`);
      console.log(`⚠️  API Magazord limita a 30 dias por busca. Fazendo múltiplas requisições...`);
      
      const todosCarrinhos = [];
      const DIAS_POR_LOTE = 30; // Limite da API
      const numLotes = Math.ceil(diasAtras / DIAS_POR_LOTE);
      
      // Formatar datas no padrão DD/MM/YYYY HH:MM:SS
      const formatarData = (data) => {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, '0');
        const min = String(data.getMinutes()).padStart(2, '0');
        const seg = String(data.getSeconds()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
      };

      // Buscar em lotes de 30 dias
      for (let i = 0; i < numLotes; i++) {
        const dataFim = new Date();
        dataFim.setTime(dataFim.getTime() - (i * DIAS_POR_LOTE * 24 * 60 * 60 * 1000));
        
        const dataInicio = new Date();
        const diasNesteLote = Math.min(DIAS_POR_LOTE, diasAtras - (i * DIAS_POR_LOTE));
        dataInicio.setTime(dataFim.getTime() - (diasNesteLote * 24 * 60 * 60 * 1000));

        const dataAtualizacaoInicio = formatarData(dataInicio);
        const dataAtualizacaoFim = formatarData(dataFim);
        
        console.log(`  Lote ${i + 1}/${numLotes}: ${dataAtualizacaoInicio} até ${dataAtualizacaoFim}`);

        try {
          const response = await axios.get(`${this.baseUrl}/carrinho`, {
            params: {
              limit: limit,
              page: 1,
              orderDirection: 'desc',
              status: '2,3',
              dataAtualizacaoInicio: dataAtualizacaoInicio,
              dataAtualizacaoFim: dataAtualizacaoFim
            },
            auth: this.auth
          });

          const carrinhosLote = response.data?.data?.items || [];
          console.log(`    ✅ ${carrinhosLote.length} carrinhos neste lote`);
          
          todosCarrinhos.push(...carrinhosLote);
          
        } catch (error) {
          console.error(`    ❌ Erro no lote ${i + 1}:`, error.message);
          // Continua com os próximos lotes mesmo se um falhar
        }
      }

      console.log(`✅ Total de ${todosCarrinhos.length} carrinhos encontrados nos últimos ${diasAtras} dias`);
      
      return todosCarrinhos;
    } catch (error) {
      console.error('❌ Erro ao listar carrinhos:', error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
      }
      throw new Error(`Erro ao listar carrinhos: ${error.message}`);
    }
  }  /**
   * Coleta todos os dados necessários a partir de um carrinho ID
   * Se dadosCarrinho for fornecido, usa esses dados ao invés de buscar novamente
   */
  async coletarDadosCompletos(carrinhoId, dadosCarrinho = null) {
    try {
      console.log(`Iniciando coleta de dados para carrinho ${carrinhoId}`);

      // 1. Usar carrinho fornecido ou buscar
      let carrinho = dadosCarrinho;
      if (!carrinho) {
        carrinho = await this.getCarrinho(carrinhoId);
        if (!carrinho) {
          throw new Error(`Carrinho ${carrinhoId} não encontrado`);
        }
      }

      // Verificar se o status é 2 ou 3
      if (carrinho.status !== 2 && carrinho.status !== 3) {
        throw new Error(`Carrinho ${carrinhoId} não está com status 2 ou 3 (atual: ${carrinho.status})`);
      }

      // 2. Buscar pedido a partir do carrinho
      const codigoPedido = carrinho.pedido?.codigo;
      if (!codigoPedido) {
        throw new Error(`Carrinho ${carrinhoId} não possui pedido associado`);
      }

      const pedido = await this.getPedido(codigoPedido);
      if (!pedido) {
        throw new Error(`Pedido ${codigoPedido} não encontrado`);
      }

      // 3. Buscar pessoa a partir do pedido
      const pessoaId = pedido.pessoaId;
      if (!pessoaId) {
        throw new Error(`Pedido ${codigoPedido} não possui pessoa associada`);
      }

      const pessoa = await this.getPessoa(pessoaId);
      if (!pessoa) {
        throw new Error(`Pessoa ${pessoaId} não encontrada`);
      }

      // 4. VALIDAÇÃO OBRIGATÓRIA: Verificar se tem email OU telefone
      const email = pessoa.email || '';
      const telefone = this.extrairTelefone(pessoa);
      
      if (!email && !telefone) {
        throw new Error(`Carrinho ${carrinhoId} - Pessoa ${pessoaId} não possui email nem telefone (obrigatório para GHL)`);
      }

      console.log(`✅ Dados coletados com sucesso para carrinho ${carrinhoId}`);

      return {
        carrinho,
        pedido,
        pessoa
      };
    } catch (error) {
      console.error(`❌ Erro na coleta de dados completos:`, error.message);
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
}
