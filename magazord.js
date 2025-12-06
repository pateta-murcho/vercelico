import { processarCarrinho, healthCheck } from './src/routes/carrinho.route.js';
import { processarTodosCarrinhos, processarWebhookMagazord } from './src/routes/auto-scan.route.js';
import { webhookStatusPedido, scanPedidosRecentes } from './src/routes/pedido.route.js';

/**
 * Handler principal do Vercel
 * Roteamento simples baseado no path e método
 * Última atualização: 2025-12-03 19:47
 */
export default async function handler(req, res) {
  const { method, url } = req;
  const path = url?.split('?')[0] || '/';

  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder OPTIONS para CORS preflight
  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Rotas
    if (path === '/' || path === '/health') {
      return await healthCheck(req, res);
    }

    // ROTA PRINCIPAL: Scan automático de TODOS os carrinhos
    if (path === '/auto-scan' || path === '/scan') {
      return await processarTodosCarrinhos(req, res);
    }

    // ROTA: Webhook da Magazord (processamento individual em tempo real)
    if (path === '/webhook-magazord' || path === '/webhook') {
      return await processarWebhookMagazord(req, res);
    }

    // ROTA: Webhook para mudanças de status de pedidos
    if (path === '/webhook-status' || path === '/webhook-pedido') {
      return await webhookStatusPedido(req, res);
    }

    // ROTA: Scan manual de pedidos recentes (últimos 7 dias)
    if (path === '/scan-pedidos' || path === '/pedidos') {
      return await scanPedidosRecentes(req, res);
    }

    // ROTA LEGADA: Processar carrinho individual manualmente
    if (path === '/processar' || path === '/processar-carrinho') {
      if (method !== 'POST' && method !== 'GET') {
        return res.status(405).json({ 
          error: true, 
          message: 'Método não permitido. Use POST ou GET.' 
        });
      }
      return await processarCarrinho(req, res);
    }

    // Rota não encontrada
    return res.status(404).json({
      error: true,
      message: 'Rota não encontrada',
      rotas_disponiveis: [
        { 
          path: '/', 
          method: 'GET', 
          descricao: 'Health check' 
        },
        { 
          path: '/auto-scan', 
          method: 'GET/POST', 
          descricao: '🤖 SCAN AUTOMÁTICO - Busca e processa TODOS os carrinhos (status 2 e 3)',
          observacao: 'Evita duplicados automaticamente. Use esta rota no Vercel Cron!'
        },
        { 
          path: '/webhook-magazord', 
          method: 'POST', 
          descricao: '📨 WEBHOOK - Recebe notificação da Magazord e processa carrinho individual',
          parametros: {
            carrinho_id: 'ID do carrinho (obrigatório)'
          },
          observacao: 'Configure esta URL no painel do Magazord para processamento em tempo real'
        },
        {
          path: '/webhook-status',
          method: 'POST',
          descricao: '📦 WEBHOOK STATUS - Recebe mudanças de status de pedidos do Magazord',
          parametros: {
            pedido_codigo: 'Código do pedido (obrigatório)',
            situacao: 'Código da situação (opcional)'
          },
          observacao: 'Processa status desde Aguardando Pagamento até envio (NÃO processa já Entregues)',
          situacoes: {
            1: 'Aguardando Pagamento',
            3: 'Pago',
            4: 'Aprovado',
            8: 'Entregue (não processado)'
          }
        },
        {
          path: '/scan-pedidos',
          method: 'GET/POST',
          descricao: '🔍 SCAN PEDIDOS - Busca pedidos recentes (últimos 7 dias)',
          parametros: {
            dias: 'Número de dias para buscar (padrão: 7)'
          },
          observacao: 'Busca apenas pedidos Aguardando, Pagos e Aprovados (não busca já Entregues)'
        },
        { 
          path: '/processar', 
          method: 'POST/GET', 
          descricao: 'Processa carrinho individual manualmente',
          parametros: {
            carrinho_id: 'ID do carrinho (obrigatório)',
            ghl_webhook_url: 'URL do webhook do GHL (opcional - usa padrão se omitido)'
          }
        }
      ],
      modo_recomendado: {
        automatico: 'Configure Vercel Cron para chamar /auto-scan a cada 5-15 minutos',
        webhook: 'Configure Magazord para enviar notificações para /webhook-magazord'
      }
    });

  } catch (error) {
    console.error('Erro no handler:', error);
    return res.status(500).json({
      error: true,
      message: 'Erro interno do servidor',
      details: error.message
    });
  }
}
