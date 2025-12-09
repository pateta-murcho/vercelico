import axios from 'axios';

async function testarLinkPagamento() {
  try {
    // Primeiro buscar lista de pedidos
    const response = await axios.get(
      'https://danajalecos.painel.magazord.com.br/api/v2/site/pedido',
      {
        params: {
          limit: 5,
          situacao: '1,3,4'
        },
        auth: {
          username: 'MZDKe610ed8d77404c8ebe37b79a35b579a5e4e85682c15d6bd89f30d5852757',
          password: 'o#W51myRIS@j'
        }
      }
    );

    const pedidos = response.data?.data?.items || [];
    
    if (pedidos.length === 0) {
      console.log('Nenhum pedido encontrado');
      return;
    }

    // Buscar detalhes completos do primeiro pedido
    const codigoPedido = pedidos[0].codigo;
    console.log('Buscando detalhes do pedido:', codigoPedido);
    
    const detalhes = await axios.get(
      `https://danajalecos.painel.magazord.com.br/api/v2/site/pedido/${codigoPedido}`,
      {
        auth: {
          username: 'MZDKe610ed8d77404c8ebe37b79a35b579a5e4e85682c15d6bd89f30d5852757',
          password: 'o#W51myRIS@j'
        }
      }
    );

    const pedidoCompleto = detalhes.data?.data || {};
    
    console.log('\n=== ESTRUTURA COMPLETA DO PEDIDO ===\n');
    console.log(JSON.stringify(pedidoCompleto, null, 2));

  } catch (error) {
    console.error('Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Resposta:', error.response.data);
    }
  }
}

testarLinkPagamento();
