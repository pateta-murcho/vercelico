import { PedidoService } from './src/services/pedido.service.js';

async function debugItens() {
  const pedidoService = new PedidoService();
  const codigoPedido = '0012512472867';

  const pedido = await pedidoService.getPedido(codigoPedido);

  console.log('Chaves do pedido:', Object.keys(pedido));
  console.log('');
  console.log('pedidoItem:', pedido.pedidoItem);
  console.log('');
  console.log('Tipo de pedidoItem:', typeof pedido.pedidoItem);
  console.log('É array?', Array.isArray(pedido.pedidoItem));
  console.log('Length:', pedido.pedidoItem?.length);
}

debugItens();
