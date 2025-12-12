import { PedidoService } from './src/services/pedido.service.js';
import { PedidoTransformerService } from './src/services/pedido-transformer.service.js';

/**
 * Script de teste para o pedido 3113
 * Verifica se todos os campos estão sendo gerados corretamente
 */
async function testarPedido3113() {
  console.log('');
  console.log('='.repeat(70));
  console.log('🧪 TESTE DO PEDIDO 3113');
  console.log('='.repeat(70));
  console.log('');

  try {
    const pedidoService = new PedidoService();
    const transformerService = new PedidoTransformerService();

    // Código do pedido
    const codigoPedido = '0012512472867';

    console.log(`📡 Buscando pedido ${codigoPedido}...`);
    console.log('');

    // 1. Coletar dados completos
    const dadosPedido = await pedidoService.coletarDadosCompletosPedido(codigoPedido);

    console.log('✅ Dados coletados do Magazord');
    console.log('');
    console.log('📊 Informações do pedido:');
    console.log(`   ID: ${dadosPedido.pedido.id}`);
    console.log(`   Código: ${dadosPedido.pedido.codigo}`);
    console.log(`   Status: ${dadosPedido.pedido.pedidoSituacaoDescricao}`);
    console.log(`   Cliente: ${dadosPedido.pessoa.nome}`);
    console.log(`   Valor: R$ ${dadosPedido.pedido.valorTotal}`);
    console.log('');

    // Mock de headers HTTP (simulando webhook)
    const mockHeaders = {
      'host': 'services.leadconnectorhq.com',
      'cf-ray': '9ab70de2d94882e8-GIG',
      'x-forwarded-for': '2804:1b0:f412:7c59:5154:b0b2:1c1f:2fb3,10.10.1.67',
      'user-agent': 'axios/1.13.2',
      'cdn-loop': 'cloudflare; loops=1',
      'accept-encoding': 'gzip, br',
      'accept': 'application/json, text/plain, */*',
      'x-forwarded-proto': 'https',
      'content-type': 'application/json',
      'cf-ipcountry': 'BR',
      'cf-visitor': { scheme: 'https' },
      'cf-connecting-ip': '2804:1b0:f412:7c59:5154:b0b2:1c1f:2fb3',
      'content-length': '872',
      'x-envoy-external-address': '10.10.1.67',
      'x-request-id': 'badc197b-0948-4c27-a645-5fdc0fcbbfa8',
      'x-envoy-attempt-count': '1',
      'x-forwarded-client-cert': 'By=spiffe://cluster.local/ns/default/sa/default-automation-workflows;Hash=ff4fe7edfae7843c8c85b0c15dc5d25066defe18ba35d305e3e45d08a65f22b3;Subject="";URI=spiffe://cluster.local/ns/istio-system/sa/istio-ingressgateway-service-account',
      'x-b3-traceid': 'e816ac2faf5fe44439c95511f11411e6',
      'x-b3-spanid': '25513acb8b03d2e9',
      'x-b3-parentspanid': '39c95511f11411e6',
      'x-b3-sampled': '0'
    };

    // 2. Transformar dados
    console.log('🔄 Transformando dados...');
    const dadosTransformados = transformerService.transformarPedido(dadosPedido, mockHeaders);

    console.log('');
    console.log('='.repeat(70));
    console.log('📦 JSON FINAL TRANSFORMADO:');
    console.log('='.repeat(70));
    console.log('');
    console.log(JSON.stringify(dadosTransformados, null, 2));
    console.log('');
    console.log('='.repeat(70));
    console.log('');

    // 3. Verificar campos obrigatórios
    console.log('✅ Verificação dos campos:');
    console.log('');
    console.log(`   ✓ tipo_evento: ${dadosTransformados.tipo_evento}`);
    console.log(`   ✓ pedido_id: ${dadosTransformados.pedido_id}`);
    console.log(`   ✓ pedido_codigo: ${dadosTransformados.pedido_codigo}`);
    console.log(`   ✓ status.codigo: ${dadosTransformados.status.codigo}`);
    console.log(`   ✓ status.descricao: ${dadosTransformados.status.descricao}`);
    console.log(`   ✓ pessoa.nome: ${dadosTransformados.pessoa.nome}`);
    console.log(`   ✓ pessoa.email: ${dadosTransformados.pessoa.email}`);
    console.log(`   ✓ pessoa.telefone: ${dadosTransformados.pessoa.telefone}`);
    console.log(`   ✓ pedido.valor_total: ${dadosTransformados.pedido.valor_total}`);
    console.log(`   ✓ pedido.itens: ${dadosTransformados.pedido.itens.length} item(s)`);
    console.log(`   ✓ entrega.status: ${dadosTransformados.entrega.status}`);
    console.log(`   ✓ entrega.codigo_rastreio: ${dadosTransformados.entrega.codigo_rastreio || '(vazio)'}`);
    console.log(`   ✓ headers: ${dadosTransformados.headers ? 'Presente' : 'Ausente'}`);
    console.log('');

    // 4. Verificar estrutura de entrega
    console.log('📦 Estrutura de entrega:');
    console.log('');
    console.log('   Campos presentes:');
    Object.keys(dadosTransformados.entrega).forEach(campo => {
      const valor = dadosTransformados.entrega[campo];
      const tipo = Array.isArray(valor) ? `array[${valor.length}]` : typeof valor;
      console.log(`   - ${campo}: ${tipo}`);
    });
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(70));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ERRO NO TESTE');
    console.error('='.repeat(70));
    console.error('Mensagem:', error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Executar teste
testarPedido3113();
