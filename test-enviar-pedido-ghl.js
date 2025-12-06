/**
 * Teste de envio de pedido para GHL
 */

import { PedidoService } from './src/services/pedido.service.js';
import { PedidoTransformerService } from './src/services/pedido-transformer.service.js';
import { GHLService } from './src/services/ghl.service.js';

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6';

console.log('');
console.log('='.repeat(70));
console.log('🚀 TESTE - ENVIO DE PEDIDO PARA GHL');
console.log('='.repeat(70));
console.log('');

async function testar() {
  try {
    const pedidoService = new PedidoService();
    const transformerService = new PedidoTransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // 1. Buscar pedidos recentes
    console.log('📡 [1/4] Buscando pedidos recentes...');
    const pedidos = await pedidoService.listarPedidosPorSituacao([1, 3, 4], 7);
    
    if (!pedidos || pedidos.length === 0) {
      console.log('⚠️  Nenhum pedido encontrado');
      return;
    }

    console.log(`✅ Encontrados ${pedidos.length} pedidos`);
    console.log('');

    // Pegar o primeiro pedido
    const primeiroPedido = pedidos[0];
    console.log(`🎯 Enviando pedido: ${primeiroPedido.codigo}`);
    console.log('');

    // 2. Buscar dados completos
    console.log('📡 [2/4] Coletando dados completos...');
    const dadosCompletos = await pedidoService.coletarDadosCompletosPedido(primeiroPedido.codigo);
    console.log(`✅ Cliente: ${dadosCompletos.pessoa.nome}`);
    console.log(`✅ Status: ${dadosCompletos.pedido.pedidoSituacaoDescricao}`);
    console.log('');

    // 3. Transformar para formato GHL
    console.log('🔄 [3/4] Transformando dados...');
    const dadosTransformados = transformerService.transformarPedido(dadosCompletos);
    console.log('✅ Dados transformados');
    console.log('');

    // Exibir JSON que será enviado
    console.log('📦 JSON que será enviado ao GHL:');
    console.log('');
    console.log(JSON.stringify(dadosTransformados, null, 2));
    console.log('');

    // 4. Enviar para GHL
    console.log('🚀 [4/4] Enviando para GHL...');
    await ghlService.enviarDados(dadosTransformados);
    
    console.log('');
    console.log('='.repeat(70));
    console.log('✅ PEDIDO ENVIADO COM SUCESSO PARA O GHL!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📝 Resumo:');
    console.log(`   - Pedido: ${dadosTransformados.pedido_codigo}`);
    console.log(`   - Cliente: ${dadosTransformados.pessoa.nome}`);
    console.log(`   - Email: ${dadosTransformados.pessoa.email}`);
    console.log(`   - Telefone: ${dadosTransformados.pessoa.telefone}`);
    console.log(`   - Status: ${dadosTransformados.status.descricao}`);
    console.log(`   - Tipo Evento: ${dadosTransformados.tipo_evento}`);
    console.log(`   - Valor: R$ ${dadosTransformados.pedido.valor_total}`);
    console.log(`   - Rastreamento: ${dadosTransformados.entrega.status}`);
    if (dadosTransformados.entrega.codigo_rastreio) {
      console.log(`   - Código Rastreio: ${dadosTransformados.entrega.codigo_rastreio}`);
    }
    console.log('');
    console.log('👀 Agora confira no painel do GHL se os dados chegaram corretamente!');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ ERRO:');
    console.error(error.message);
    console.error('');
  }
}

testar();
