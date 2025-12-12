import { PedidoService } from './src/services/pedido.service.js';

async function verificarDadosBrutos() {
  const pedidoService = new PedidoService();
  const codigoPedido = '0012512472867';

  console.log('📡 Buscando pedido...');
  const pedido = await pedidoService.getPedido(codigoPedido);

  console.log('');
  console.log('🔍 Estrutura do pedido:');
  console.log(JSON.stringify(pedido, null, 2));
}

verificarDadosBrutos();
