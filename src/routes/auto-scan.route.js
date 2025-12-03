import { MagazordService } from '../services/magazord.service.js';
import { TransformerService } from '../services/transformer.service.js';
import { GHLService } from '../services/ghl.service.js';
import { ControleProcessamento } from '../utils/controle-processamento.js';

// URL do webhook GHL configurada
const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6';

/**
 * Função principal que busca e processa TODOS os carrinhos automaticamente
 * Evita duplicados usando controle de processamento
 */
export async function processarTodosCarrinhos(req, res) {
  const inicio = Date.now();
  
  console.log('');
  console.log('='.repeat(70));
  console.log('🤖 SCAN AUTOMÁTICO - MAGAZORD → GHL');
  console.log('='.repeat(70));
  console.log('⏰ Iniciado em:', new Date().toISOString());
  console.log('');

  try {
    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // 1. Buscar todos os carrinhos com status 2 ou 3
    console.log('📡 [1/3] Buscando carrinhos da API Magazord...');
    const carrinhos = await magazordService.listarCarrinhos(100, 180); // Últimos 6 meses, até 100 carrinhos

    if (!carrinhos || carrinhos.length === 0) {
      console.log('⚠️  Nenhum carrinho encontrado');
      return res.status(200).json({
        success: true,
        message: 'Nenhum carrinho encontrado',
        processados: 0,
        ignorados: 0,
        erros: 0,
        tempo_ms: Date.now() - inicio
      });
    }

    console.log(`✅ Encontrados ${carrinhos.length} carrinhos`);
    console.log('');

    // 2. Filtrar carrinhos com pedido associado
    const carrinhosComPedido = carrinhos.filter(c => c.pedido && c.pedido.codigo);
    console.log(`📋 ${carrinhosComPedido.length} carrinhos têm pedido associado`);
    console.log('');

    // 3. Processar cada carrinho
    console.log('🔄 [2/3] Processando carrinhos...');
    console.log('');

    const resultados = {
      processados: [],
      ignorados: [],
      erros: []
    };

    for (const carrinho of carrinhosComPedido) {
      const carrinhoId = carrinho.id;
      
      try {
        console.log(`🔄 Processando carrinho ${carrinhoId}...`);

        // Coletar dados completos
        const dadosMagazord = await magazordService.coletarDadosCompletos(carrinhoId, carrinho);

        // Transformar dados
        const dadosTransformados = transformerService.transformarDados(carrinhoId, dadosMagazord);

        // Enviar para GHL
        await ghlService.enviarDados(dadosTransformados);

        console.log(`✅ Carrinho ${carrinhoId} - SUCESSO`);
        console.log('');

        resultados.processados.push({
          carrinho_id: carrinhoId,
          pedido_id: dadosTransformados.pedido_id,
          cliente: dadosTransformados.pessoa.nome,
          valor: dadosTransformados.pedido.valor_total
        });

      } catch (error) {
        console.error(`❌ Carrinho ${carrinhoId} - ERRO: ${error.message}`);
        console.log('');
        
        resultados.erros.push({
          carrinho_id: carrinhoId,
          erro: error.message
        });
      }
    }

    // 4. Resumo final
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
      message: 'Scan automático concluído',
      resumo: {
        total_encontrados: carrinhos.length,
        com_pedido: carrinhosComPedido.length,
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
    console.error('❌ ERRO NO SCAN AUTOMÁTICO');
    console.error('='.repeat(70));
    console.error('Mensagem:', error.message);
    console.error('');

    return res.status(500).json({
      success: false,
      error: 'Erro no scan automático',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handler para webhook da Magazord (processamento individual em tempo real)
 */
export async function processarWebhookMagazord(req, res) {
  console.log('');
  console.log('📨 WEBHOOK RECEBIDO DA MAGAZORD');
  console.log('');

  try {
    // Extrair carrinho_id do webhook
    const carrinhoId = req.body?.carrinho_id || req.body?.id || req.query?.carrinho_id;

    if (!carrinhoId) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro carrinho_id não fornecido',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🎯 Processando carrinho ${carrinhoId} via webhook...`);

    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // Coletar dados completos
    console.log('📡 Coletando dados do Magazord...');
    const dadosMagazord = await magazordService.coletarDadosCompletos(carrinhoId);

    // Transformar dados
    console.log('🔄 Transformando dados...');
    const dadosTransformados = transformerService.transformarDados(carrinhoId, dadosMagazord);

    // Enviar para GHL
    console.log('🚀 Enviando para GHL...');
    await ghlService.enviarDados(dadosTransformados);

    console.log(`✅ Carrinho ${carrinhoId} processado com sucesso via webhook`);
    console.log('');

    return res.status(200).json({
      success: true,
      message: 'Carrinho processado e enviado para GHL',
      carrinho_id: carrinhoId,
      pedido_id: dadosTransformados.pedido_id,
      cliente: dadosTransformados.pessoa.nome,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error.message);
    
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar webhook',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
