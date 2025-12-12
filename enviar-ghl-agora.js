import { PedidoService } from './src/services/pedido.service.js';
import { PedidoTransformerService } from './src/services/pedido-transformer.service.js';
import { GHLService } from './src/services/ghl.service.js';

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6';

async function enviarParaGHL() {
  console.log('');
  console.log('='.repeat(70));
  console.log('🚀 ENVIANDO DADOS COMPLETOS PARA GHL');
  console.log('='.repeat(70));
  console.log('');

  try {
    const pedidoService = new PedidoService();
    const transformerService = new PedidoTransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    const codigoPedido = '0012512472867';

    console.log(`📡 Coletando dados do pedido ${codigoPedido}...`);
    const dadosPedido = await pedidoService.coletarDadosCompletosPedido(codigoPedido);

    // Mock de headers HTTP
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

    console.log('🔄 Transformando dados...');
    const dadosTransformados = transformerService.transformarPedido(dadosPedido, mockHeaders);

    console.log('');
    console.log('📦 JSON QUE SERÁ ENVIADO:');
    console.log('');
    console.log(JSON.stringify(dadosTransformados, null, 2));
    console.log('');

    console.log('🚀 Enviando para GHL...');
    console.log(`URL: ${GHL_WEBHOOK_URL}`);
    console.log('');

    await ghlService.enviarDados(dadosTransformados);

    console.log('');
    console.log('='.repeat(70));
    console.log('✅ DADOS ENVIADOS COM SUCESSO PARA O GHL!');
    console.log('='.repeat(70));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ERRO AO ENVIAR PARA GHL');
    console.error('='.repeat(70));
    console.error('Mensagem:', error.message);
    console.error('');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Resposta:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

enviarParaGHL();
