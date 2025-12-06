import { PedidoService } from '../services/pedido.service.js';
import { PedidoTransformerService } from '../services/pedido-transformer.service.js';
import { GHLService } from '../services/ghl.service.js';

// URL do webhook GHL configurada
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6';

/**
 * Webhook para receber notificações do Magazord sobre mudanças de status de pedidos
 * 
 * O Magazord deve ser configurado para enviar webhooks para esta rota quando:
 * - Pedido é criado (Aguardando Pagamento)
 * - Pagamento é confirmado
 * - Pedido é aprovado
 * - Pedido é enviado (com código de rastreamento)
 * - Status de entrega muda
 */
export async function webhookStatusPedido(req, res) {
  console.log('');
  console.log('='.repeat(70));
  console.log('📨 WEBHOOK RECEBIDO - MUDANÇA DE STATUS');
  console.log('='.repeat(70));
  console.log('⏰ Recebido em:', new Date().toISOString());
  console.log('');

  try {
    // O Magazord envia o código do pedido no webhook
    const codigoPedido = req.body?.pedido_codigo || req.body?.codigo || req.query?.codigo;

    if (!codigoPedido) {
      console.log('⚠️  Webhook sem código de pedido');
      console.log('Body recebido:', JSON.stringify(req.body, null, 2));
      
      return res.status(400).json({
        success: false,
        error: 'Código do pedido não fornecido',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🎯 Processando pedido: ${codigoPedido}`);
    console.log('');

    // Inicializar serviços
    const pedidoService = new PedidoService();
    const transformerService = new PedidoTransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // 1. Coletar dados completos do pedido
    console.log('📡 [1/3] Coletando dados do pedido...');
    const dadosPedido = await pedidoService.coletarDadosCompletosPedido(codigoPedido);

    // Log do status atual
    const statusAtual = dadosPedido.pedido.pedidoSituacaoDescricao || 'Desconhecido';
    console.log(`📊 Status do pedido: ${statusAtual}`);
    console.log('');

    // 2. Transformar dados
    console.log('🔄 [2/3] Transformando dados...');
    const dadosTransformados = transformerService.transformarPedido(dadosPedido);

    // Verificar se tem rastreamento
    if (dadosTransformados.entrega.status === 'rastreavel') {
      console.log(`📦 Rastreamento: ${dadosTransformados.entrega.codigo_rastreio}`);
      console.log(`🚚 Transportadora: ${dadosTransformados.entrega.transportadora}`);
      if (dadosTransformados.entrega.previsao_entrega) {
        console.log(`📅 Previsão: ${dadosTransformados.entrega.previsao_entrega}`);
      }
    }
    console.log('');

    // 3. Enviar para GHL
    console.log('🚀 [3/3] Enviando para GHL...');
    await ghlService.enviarDados(dadosTransformados);

    console.log(`✅ Pedido ${codigoPedido} processado com sucesso`);
    console.log('');
    console.log('='.repeat(70));

    return res.status(200).json({
      success: true,
      message: 'Webhook processado e enviado para GHL',
      pedido_codigo: codigoPedido,
      pedido_id: dadosTransformados.pedido_id,
      status: dadosTransformados.status.descricao,
      tipo_evento: dadosTransformados.tipo_evento,
      cliente: dadosTransformados.pessoa.nome,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('');
    console.error('❌ ERRO AO PROCESSAR WEBHOOK');
    console.error('Mensagem:', error.message);
    console.error('');

    return res.status(500).json({
      success: false,
      error: 'Erro ao processar webhook',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Scan manual de pedidos recentes (últimos 7 dias)
 * Busca apenas pedidos com situações:
 * - 1 = Aguardando Pagamento
 * - 3 = Pago
 * - 4 = Aprovado
 * 
 * NÃO busca pedidos já "Entregues" (situação 8)
 */
export async function scanPedidosRecentes(req, res) {
  const inicio = Date.now();
  
  console.log('');
  console.log('='.repeat(70));
  console.log('🔍 SCAN DE PEDIDOS RECENTES');
  console.log('='.repeat(70));
  console.log('⏰ Iniciado em:', new Date().toISOString());
  console.log('');

  try {
    // Inicializar serviços
    const pedidoService = new PedidoService();
    const transformerService = new PedidoTransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // Definir parâmetros da busca
    const diasAtras = parseInt(req.query?.dias) || 7;
    const situacoes = [1, 3, 4]; // Aguardando, Pago, Aprovado

    console.log(`📊 Buscando pedidos dos últimos ${diasAtras} dias`);
    console.log(`🎯 Situações: Aguardando Pagamento (1), Pago (3), Aprovado (4)`);
    console.log('');

    // 1. Buscar pedidos
    console.log('📡 [1/3] Buscando pedidos na API Magazord...');
    const pedidos = await pedidoService.listarPedidosPorSituacao(situacoes, diasAtras);

    if (!pedidos || pedidos.length === 0) {
      console.log('⚠️  Nenhum pedido encontrado');
      return res.status(200).json({
        success: true,
        message: 'Nenhum pedido encontrado',
        processados: 0,
        ignorados: 0,
        erros: 0,
        tempo_ms: Date.now() - inicio
      });
    }

    console.log(`✅ Encontrados ${pedidos.length} pedidos`);
    console.log('');

    // 2. Processar cada pedido
    console.log('🔄 [2/3] Processando pedidos...');
    console.log('');

    const resultados = {
      processados: [],
      ignorados: [],
      erros: []
    };

    for (const pedido of pedidos) {
      const codigoPedido = pedido.codigo;
      
      try {
        console.log(`🔄 Processando pedido ${codigoPedido}...`);

        // Coletar dados completos
        const dadosPedido = await pedidoService.coletarDadosCompletosPedido(codigoPedido);

        // Transformar dados
        const dadosTransformados = transformerService.transformarPedido(dadosPedido);

        // Enviar para GHL
        await ghlService.enviarDados(dadosTransformados);

        console.log(`✅ Pedido ${codigoPedido} - SUCESSO`);
        console.log('');

        resultados.processados.push({
          pedido_codigo: codigoPedido,
          pedido_id: dadosTransformados.pedido_id,
          cliente: dadosTransformados.pessoa.nome,
          status: dadosTransformados.status.descricao,
          valor: dadosTransformados.pedido.valor_total
        });

      } catch (error) {
        // Se o erro for por falta de email/telefone, apenas ignora
        if (error.message.includes('não possui email nem telefone')) {
          console.log(`⏭️  Pedido ${codigoPedido} - IGNORADO: ${error.message}`);
          console.log('');
          
          resultados.ignorados.push({
            pedido_codigo: codigoPedido,
            motivo: 'sem_email_telefone'
          });
        } else {
          console.error(`❌ Pedido ${codigoPedido} - ERRO: ${error.message}`);
          console.log('');
          
          resultados.erros.push({
            pedido_codigo: codigoPedido,
            erro: error.message
          });
        }
      }
    }

    // 3. Resumo final
    const tempoTotal = Date.now() - inicio;
    
    console.log('='.repeat(70));
    console.log('📊 RESUMO DO SCAN');
    console.log('='.repeat(70));
    console.log(`✅ Processados: ${resultados.processados.length}`);
    console.log(`⏭️  Ignorados: ${resultados.ignorados.length}`);
    console.log(`❌ Erros: ${resultados.erros.length}`);
    console.log(`⏱️  Tempo total: ${tempoTotal}ms`);
    console.log('='.repeat(70));
    console.log('');

    // Retornar resposta
    return res.status(200).json({
      success: true,
      message: 'Scan de pedidos concluído',
      resumo: {
        total_encontrados: pedidos.length,
        processados: resultados.processados.length,
        ignorados: resultados.ignorados.length,
        erros: resultados.erros.length
      },
      detalhes: {
        processados: resultados.processados,
        ignorados: resultados.ignorados.length > 0 ? resultados.ignorados : undefined,
        erros: resultados.erros.length > 0 ? resultados.erros : undefined
      },
      tempo_ms: tempoTotal,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ERRO NO SCAN DE PEDIDOS');
    console.error('='.repeat(70));
    console.error('Mensagem:', error.message);
    console.error('');

    return res.status(500).json({
      success: false,
      error: 'Erro no scan de pedidos',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
