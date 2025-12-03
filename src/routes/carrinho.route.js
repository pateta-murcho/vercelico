import { MagazordService } from '../services/magazord.service.js';
import { TransformerService } from '../services/transformer.service.js';
import { GHLService } from '../services/ghl.service.js';

// Webhook GHL padrão configurado
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6';

/**
 * Handler que processa automaticamente os carrinhos mais recentes
 * Busca carrinhos com status 2 ou 3 e envia para o GHL
 */
export async function processarCarrinhosAutomatico(req, res) {
  try {
    console.log('🚀 Iniciando processamento automático de carrinhos...');

    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // 1. Buscar carrinhos recentes
    const limit = req.body?.limit || req.query?.limit || 5;
    const carrinhos = await magazordService.listarCarrinhos(limit);

    if (!carrinhos || carrinhos.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum carrinho encontrado com status 2 ou 3',
        total_processados: 0,
        timestamp: new Date().toISOString()
      });
    }

    // 2. Filtrar apenas carrinhos com pedido
    const carrinhosComPedido = carrinhos.filter(c => c.pedido && c.pedido.codigo);

    if (carrinhosComPedido.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Nenhum carrinho com pedido associado encontrado',
        total_encontrados: carrinhos.length,
        total_processados: 0,
        timestamp: new Date().toISOString()
      });
    }

    // 3. Processar cada carrinho
    const resultados = [];
    for (const carrinho of carrinhosComPedido) {
      try {
        // Coletar dados completos
        const dadosMagazord = await magazordService.coletarDadosCompletos(carrinho.id, carrinho);
        
        // Transformar dados
        const dadosTransformados = transformerService.transformarDados(carrinho.id, dadosMagazord);
        
        // Enviar para GHL
        await ghlService.enviarDados(dadosTransformados);
        
        resultados.push({
          carrinho_id: carrinho.id,
          pedido_id: dadosTransformados.pedido_id,
          status: 'success',
          cliente: dadosTransformados.pessoa.nome
        });
      } catch (error) {
        resultados.push({
          carrinho_id: carrinho.id,
          status: 'error',
          error: error.message
        });
      }
    }

    // 4. Retornar resumo
    const sucessos = resultados.filter(r => r.status === 'success').length;
    const erros = resultados.filter(r => r.status === 'error').length;

    return res.status(200).json({
      success: true,
      message: `Processamento concluído: ${sucessos} enviados, ${erros} erros`,
      total_encontrados: carrinhos.length,
      total_com_pedido: carrinhosComPedido.length,
      total_processados: sucessos,
      total_erros: erros,
      resultados: resultados,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no processamento automático:', error.message);
    
    return res.status(500).json({
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handler principal que processa a requisição
 * Recebe um carrinho_id e envia os dados para o GHL
 */
export async function processarCarrinho(req, res) {
  try {
    // Extrair carrinho_id do body ou query
    const carrinhoId = req.body?.carrinho_id || req.query?.carrinho_id;
    const ghlWebhookUrl = req.body?.ghl_webhook_url || req.query?.ghl_webhook_url || GHL_WEBHOOK_URL;

    // Validar parâmetros
    if (!carrinhoId) {
      return res.status(400).json({
        error: true,
        message: 'Parâmetro carrinho_id é obrigatório'
      });
    }

    console.log(`Processando carrinho ${carrinhoId}`);

    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(ghlWebhookUrl);

    // 1. Coletar dados do Magazord
    console.log('Coletando dados do Magazord...');
    const dadosMagazord = await magazordService.coletarDadosCompletos(carrinhoId);

    // 2. Transformar dados para o formato GHL
    console.log('Transformando dados...');
    const dadosTransformados = transformerService.transformarDados(carrinhoId, dadosMagazord);

    // 3. Enviar para o GHL
    console.log('Enviando dados para GHL...');
    const resultadoGHL = await ghlService.enviarDados(dadosTransformados);

    // 4. Retornar sucesso
    return res.status(200).json({
      success: true,
      message: 'Dados processados e enviados com sucesso',
      carrinho_id: carrinhoId,
      pedido_id: dadosTransformados.pedido_id,
      ghl_response: resultadoGHL,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao processar carrinho:', error.message);
    
    return res.status(500).json({
      error: true,
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handler para health check
 */
export async function healthCheck(req, res) {
  return res.status(200).json({
    status: 'ok',
    service: 'Magazord-GHL Proxy',
    timestamp: new Date().toISOString()
  });
}
