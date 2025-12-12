import { PedidoService } from './src/services/pedido.service.js';

async function debugRastreamento() {
  const pedidoService = new PedidoService();
  const codigoPedido = '0012512472867';

  const rastreamento = await pedidoService.getRastreamento(codigoPedido);

  console.log('Rastreamento:', JSON.stringify(rastreamento, null, 2));
}

debugRastreamento();
