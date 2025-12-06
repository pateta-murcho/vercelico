/**
 * Teste de busca de pedidos recentes com rastreamento
 */

import { PedidoService } from './src/services/pedido.service.js';
import { PedidoTransformerService } from './src/services/pedido-transformer.service.js';

console.log('');
console.log('='.repeat(70));
console.log('🧪 TESTE - BUSCA DE PEDIDOS COM RASTREAMENTO');
console.log('='.repeat(70));
console.log('');

async function testar() {
  try {
    const pedidoService = new PedidoService();
    const transformerService = new PedidoTransformerService();

    // 1. Buscar pedidos recentes (últimos 7 dias)
    console.log('📡 [1/3] Buscando pedidos recentes...');
    console.log('');
    
    const pedidos = await pedidoService.listarPedidosPorSituacao([1, 3, 4], 7);
    
    if (!pedidos || pedidos.length === 0) {
      console.log('⚠️  Nenhum pedido encontrado');
      return;
    }

    console.log(`✅ Encontrados ${pedidos.length} pedidos`);
    console.log('');
    
    // Listar pedidos
    console.log('📋 Pedidos disponíveis:');
    pedidos.forEach((pedido, index) => {
      const situacao = pedidoService.getSituacaoDescricao(pedido.pedidoSituacaoId);
      console.log(`   ${index + 1}. Pedido: ${pedido.codigo} | Situação: ${situacao} | Valor: R$ ${pedido.valorTotal}`);
    });
    console.log('');

    // Pegar o primeiro pedido para testar
    const primeiroPedido = pedidos[0];
    console.log(`🎯 Testando com pedido: ${primeiroPedido.codigo}`);
    console.log('');

    // 2. Buscar dados completos (incluindo rastreamento)
    console.log('📡 [2/3] Coletando dados completos (incluindo rastreamento)...');
    const dadosCompletos = await pedidoService.coletarDadosCompletosPedido(primeiroPedido.codigo);
    
    console.log('✅ Dados coletados:');
    console.log(`   - Pedido: ${dadosCompletos.pedido.codigo}`);
    console.log(`   - Situação: ${dadosCompletos.pedido.pedidoSituacaoDescricao}`);
    console.log(`   - Cliente: ${dadosCompletos.pessoa.nome} (${dadosCompletos.pessoa.email})`);
    
    if (dadosCompletos.rastreamento) {
      const rastreio = dadosCompletos.rastreamento.arrayPedidoRastreio?.[0];
      if (rastreio && rastreio.codigoRastreamento) {
        console.log(`   - Rastreamento: ${rastreio.codigoRastreamento}`);
        console.log(`   - Transportadora: ${rastreio.transportadoraNome}`);
        if (rastreio.previsaoEntrega) {
          console.log(`   - Previsão: ${rastreio.previsaoEntrega}`);
        }
      } else {
        console.log(`   - Rastreamento: Ainda não disponível`);
      }
    } else {
      console.log(`   - Rastreamento: Não disponível`);
    }
    console.log('');

    // 3. Transformar para formato GHL
    console.log('🔄 [3/3] Transformando para formato GHL...');
    const dadosTransformados = transformerService.transformarPedido(dadosCompletos);
    
    console.log('✅ Dados transformados com sucesso');
    console.log('');

    // Exibir JSON final
    console.log('📊 JSON FINAL (que será enviado ao GHL):');
    console.log('');
    console.log(JSON.stringify(dadosTransformados, null, 2));
    console.log('');

    // Resumo
    console.log('='.repeat(70));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📝 Resumo:');
    console.log(`   - Pedido: ${dadosTransformados.pedido_codigo}`);
    console.log(`   - Cliente: ${dadosTransformados.pessoa.nome}`);
    console.log(`   - Status: ${dadosTransformados.status.descricao}`);
    console.log(`   - Tipo Evento: ${dadosTransformados.tipo_evento}`);
    console.log(`   - Valor: R$ ${dadosTransformados.pedido.valor_total}`);
    console.log(`   - Rastreamento: ${dadosTransformados.entrega.status}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERRO NO TESTE:');
    console.error(error.message);
    console.error('');
    if (error.response) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testar();
