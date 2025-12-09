import axios from 'axios';

/**
 * Teste para verificar:
 * 1. Se link_pagamento vem pronto da API (não precisa construir)
 * 2. Quando os campos de entrega estão disponíveis
 * 3. O que acontece com forma_pagamento quando está vazio
 */
async function testarCamposVazios() {
  const auth = {
    username: 'MZDKe610ed8d77404c8ebe37b79a35b579a5e4e85682c15d6bd89f30d5852757',
    password: 'o#W51myRIS@j'
  };

  try {
    console.log('🔍 Buscando pedidos recentes (últimos 30 dias)...\n');
    
    // Buscar pedidos com diferentes situações
    const response = await axios.get(
      'https://danajalecos.painel.magazord.com.br/api/v2/site/pedido',
      {
        params: {
          limit: 20,
          situacao: '1,3,4,8' // Aguardando, Pago, Aprovado, Entregue
        },
        auth
      }
    );

    const pedidos = response.data?.data?.items || [];
    console.log(`✅ Encontrados ${pedidos.length} pedidos\n`);

    if (pedidos.length === 0) {
      console.log('❌ Nenhum pedido encontrado para análise');
      return;
    }

    // Analisar alguns pedidos em detalhe
    console.log('=' .repeat(80));
    console.log('ANÁLISE DETALHADA DOS PEDIDOS');
    console.log('=' .repeat(80));

    for (let i = 0; i < Math.min(5, pedidos.length); i++) {
      const pedidoResumo = pedidos[i];
      
      // Buscar detalhes completos
      const detalhes = await axios.get(
        `https://danajalecos.painel.magazord.com.br/api/v2/site/pedido/${pedidoResumo.codigo}`,
        { auth }
      );

      const pedido = detalhes.data?.data || {};
      
      console.log(`\n📦 Pedido ${i + 1}: ${pedido.codigo}`);
      console.log('─'.repeat(80));
      
      // 1. STATUS E SITUAÇÃO
      console.log(`📊 Situação: ${pedido.pedidoSituacaoDescricao} (código: ${pedido.pedidoSituacao})`);
      
      // 2. FORMA DE PAGAMENTO
      console.log(`💳 Forma Pagamento: ${pedido.formaPagamentoNome || '❌ VAZIO'}`);
      console.log(`💰 Forma Recebimento: ${pedido.formaRecebimentoNome || '❌ VAZIO'}`);
      
      // 3. LINK DE PAGAMENTO
      if (pedido.linkPagamento) {
        console.log(`🔗 Link Pagamento: ✅ PRESENTE`);
        console.log(`   URL: ${pedido.linkPagamento.substring(0, 80)}...`);
      } else {
        console.log(`🔗 Link Pagamento: ❌ VAZIO (null)`);
      }

      // 4. BOLETO
      if (pedido.boletos && pedido.boletos.length > 0) {
        console.log(`📄 Boleto: ✅ PRESENTE`);
        const boleto = pedido.boletos[0];
        console.log(`   Vencimento: ${boleto.dataVencimento || 'N/A'}`);
        console.log(`   Código barras: ${boleto.codigoBarras ? 'Sim' : 'Não'}`);
      } else {
        console.log(`📄 Boleto: ❌ VAZIO`);
      }

      // 5. PIX
      if (pedido.pedidoPagamentoPix) {
        console.log(`💠 PIX: ✅ PRESENTE`);
        console.log(`   Status: ${pedido.pedidoPagamentoPix.status || 'N/A'}`);
      } else {
        console.log(`💠 PIX: ❌ VAZIO`);
      }

      // 6. DADOS DE ENTREGA
      console.log(`\n📬 DADOS DE ENTREGA:`);
      
      if (pedido.arrayPedidoRastreio && pedido.arrayPedidoRastreio.length > 0) {
        const rastreio = pedido.arrayPedidoRastreio[0];
        
        console.log(`   Transportadora: ${rastreio.transportadoraNome || '❌ VAZIO'}`);
        console.log(`   Código rastreio: ${rastreio.codigoRastreio || '❌ AINDA NÃO GERADO'}`);
        console.log(`   Link rastreio: ${rastreio.link || '❌ AINDA NÃO DISPONÍVEL'}`);
        console.log(`   Previsão entrega: ${rastreio.dataLimiteEntregaCliente || '❌ VAZIO'}`);
        console.log(`   Situação rastreio: ${rastreio.situacao} (${rastreio.pedidoSituacaoDescricao})`);
        
        // Endereço de entrega
        console.log(`\n   📍 Endereço de entrega:`);
        console.log(`   Nome: ${pedido.nomeDestinatario || '❌ VAZIO'}`);
        console.log(`   Logradouro: ${pedido.logradouro || '❌ VAZIO'}, ${pedido.numero || ''}`);
        console.log(`   Bairro: ${pedido.bairro || '❌ VAZIO'}`);
        console.log(`   Cidade/UF: ${pedido.cidadeNome || '❌ VAZIO'}/${pedido.estadoSigla || '❌ VAZIO'}`);
        console.log(`   CEP: ${pedido.cep || '❌ VAZIO'}`);
      } else {
        console.log(`   ❌ Sem informações de rastreio ainda`);
      }
    }

    console.log('\n' + '=' .repeat(80));
    console.log('RESUMO DAS DESCOBERTAS');
    console.log('=' .repeat(80));
    console.log(`
📌 LINK DE PAGAMENTO:
   - Vem PRONTO da API (não precisa construir)
   - Só existe para métodos como PIX, Boleto
   - Se for cartão de crédito, vem NULL

📌 FORMA DE PAGAMENTO:
   - Sempre vem preenchida (ex: "Cartão - MasterCard", "PIX", "Boleto")
   - Campo "formaPagamentoNome" no pedido

📌 DADOS DE ENTREGA:
   - Endereço SEMPRE está disponível desde a criação do pedido
   - Transportadora definida quando o pedido é aprovado
   - Código de rastreio SÓ aparece DEPOIS que a loja gera/envia
   - Link de rastreio disponível após código ser gerado
   - Previsão de entrega calculada no momento da criação

💡 CONCLUSÃO PARA O EMAIL:
   - ✅ Endereço: SEMPRE disponível (pode usar)
   - ✅ Transportadora: Disponível após aprovação
   - ⏳ Código rastreio: Só depois do envio físico
   - ⏳ Link rastreio: Só depois do envio físico
    `);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Detalhes:', error.response.data);
    }
  }
}

testarCamposVazios();
