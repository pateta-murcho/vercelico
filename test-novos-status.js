import axios from 'axios';

/**
 * Teste para verificar todos os status de pedidos que precisamos capturar
 */
async function testarNovosStatus() {
  const auth = {
    username: 'MZDKe610ed8d77404c8ebe37b79a35b579a5e4e85682c15d6bd89f30d5852757',
    password: 'o#W51myRIS@j'
  };

  try {
    console.log('🔍 Testando diferentes status de pedidos...\n');
    
    // Buscar pedidos com diferentes situações
    const situacoesParaTestar = {
      'Aguardando Pagamento': 1,
      'Em Análise': 2,
      'Pago': 3,
      'Aprovado': 4,
      'Cancelado': 0
    };

    for (const [nome, codigo] of Object.entries(situacoesParaTestar)) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 Testando: ${nome} (código ${codigo})`);
      console.log('='.repeat(80));

      const response = await axios.get(
        'https://danajalecos.painel.magazord.com.br/api/v2/site/pedido',
        {
          params: {
            limit: 3,
            situacao: codigo
          },
          auth
        }
      );

      const pedidos = response.data?.data?.items || [];
      console.log(`Encontrados: ${pedidos.length} pedidos\n`);

      if (pedidos.length > 0) {
        const pedido = pedidos[0];
        console.log(`Exemplo:`);
        console.log(`  Código: ${pedido.codigo}`);
        console.log(`  Situação: ${pedido.pedidoSituacaoDescricao}`);
        console.log(`  Situação ID: ${pedido.pedidoSituacao}`);
        console.log(`  Forma Pagamento: ${pedido.formaPagamentoNome}`);
        console.log(`  Data: ${pedido.dataHora}`);
      }
    }

    // Testar carrinhos também
    console.log(`\n${'='.repeat(80)}`);
    console.log('🛒 Testando CARRINHOS');
    console.log('='.repeat(80));

    const statusCarrinhos = {
      'Aberto (não foi p/ checkout)': 1,
      'Abandonado (foi p/ checkout mas não pagou)': 2,
      'Comprado': 3
    };

    for (const [nome, status] of Object.entries(statusCarrinhos)) {
      console.log(`\n📦 ${nome} (status ${status})`);
      
      const dataFim = new Date();
      const dataInicio = new Date();
      dataInicio.setHours(dataInicio.getHours() - 6); // Apenas 6 horas atrás

      const formatarData = (data) => {
        const dia = String(data.getDate()).padStart(2, '0');
        const mes = String(data.getMonth() + 1).padStart(2, '0');
        const ano = data.getFullYear();
        const hora = String(data.getHours()).padStart(2, '0');
        const min = String(data.getMinutes()).padStart(2, '0');
        const seg = String(data.getSeconds()).padStart(2, '0');
        return `${dia}/${mes}/${ano} ${hora}:${min}:${seg}`;
      };
      
      try {
        const response = await axios.get(
          'https://danajalecos.painel.magazord.com.br/api/v2/site/carrinho',
          {
            params: {
              limit: 3,
              status: status,
              dataAtualizacaoInicio: formatarData(dataInicio),
              dataAtualizacaoFim: formatarData(dataFim)
            },
            auth
          }
        );

        const carrinhos = response.data?.data?.items || [];
        console.log(`Encontrados: ${carrinhos.length} carrinhos`);

        if (carrinhos.length > 0) {
          const carrinho = carrinhos[0];
          console.log(`  ID: ${carrinho.id}`);
          console.log(`  Status: ${carrinho.status}`);
          console.log(`  Pedido ID: ${carrinho.pedidoId || 'Não gerou pedido'}`);
          console.log(`  Valor: R$ ${carrinho.valorTotal}`);
        }
      } catch (err) {
        console.log(`  ❌ Erro ao buscar: ${err.response?.data?.message || err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Detalhes:', error.response.data);
    }
  }
}

testarNovosStatus();
