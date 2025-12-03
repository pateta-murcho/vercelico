/**
 * Teste do SCAN AUTOMÁTICO - simula o que o Vercel Cron vai fazer
 */

import { MagazordService } from './src/services/magazord.service.js';
import { TransformerService } from './src/services/transformer.service.js';
import { GHLService } from './src/services/ghl.service.js';
import { ControleProcessamento } from './src/utils/controle-processamento.js';

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6';

console.log('');
console.log('='.repeat(70));
console.log('🤖 TESTE - SCAN AUTOMÁTICO');
console.log('='.repeat(70));
console.log('⏰ Iniciado em:', new Date().toISOString());
console.log('');
console.log('ℹ️  Este teste simula o que acontecerá a cada 15 minutos no Vercel Cron');
console.log('');
console.log('-'.repeat(70));
console.log('');

async function testarScanAutomatico() {
  const inicio = Date.now();

  try {
    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // 1. Buscar todos os carrinhos
    console.log('📡 [1/3] Buscando carrinhos da API Magazord...');
    const carrinhos = await magazordService.listarCarrinhos(100, 180); // 6 meses

    if (!carrinhos || carrinhos.length === 0) {
      console.log('⚠️  Nenhum carrinho encontrado');
      console.log('');
      return;
    }

    console.log(`✅ Encontrados ${carrinhos.length} carrinhos`);
    console.log('');

    // 2. Filtrar carrinhos com pedido
    const carrinhosComPedido = carrinhos.filter(c => c.pedido && c.pedido.codigo);
    console.log(`📋 ${carrinhosComPedido.length} carrinhos têm pedido associado`);
    console.log('');

    if (carrinhosComPedido.length === 0) {
      console.log('⚠️  Nenhum carrinho com pedido para processar');
      console.log('');
      return;
    }

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
        // Verificar se já foi processado
        if (ControleProcessamento.jaFoiProcessado(carrinhoId)) {
          console.log(`⏭️  Carrinho ${carrinhoId} - JÁ PROCESSADO (ignorando)`);
          resultados.ignorados.push(carrinhoId);
          continue;
        }

        console.log(`🔄 Processando carrinho ${carrinhoId}...`);

        // Coletar dados
        const dadosMagazord = await magazordService.coletarDadosCompletos(carrinhoId, carrinho);

        // Transformar
        const dadosTransformados = transformerService.transformarDados(carrinhoId, dadosMagazord);

        // Enviar para GHL
        await ghlService.enviarDados(dadosTransformados);

        // Marcar como processado
        ControleProcessamento.marcarComoProcessado(carrinhoId);

        console.log(`✅ Carrinho ${carrinhoId} - SUCESSO`);
        console.log(`   Cliente: ${dadosTransformados.pessoa.nome}`);
        console.log(`   Pedido: ${dadosTransformados.pedido_id}`);
        console.log(`   Valor: R$ ${dadosTransformados.pedido.valor_total}`);
        console.log('');

        resultados.processados.push({
          carrinho_id: carrinhoId,
          pedido_id: dadosTransformados.pedido_id,
          cliente: dadosTransformados.pessoa.nome
        });

      } catch (error) {
        console.error(`❌ Carrinho ${carrinhoId} - ERRO: ${error.message}`);
        console.log('');
        resultados.erros.push({ carrinho_id: carrinhoId, erro: error.message });
      }
    }

    // 4. Resumo
    const tempoTotal = Date.now() - inicio;
    
    console.log('='.repeat(70));
    console.log('📊 RESUMO DO SCAN');
    console.log('='.repeat(70));
    console.log(`✅ Processados: ${resultados.processados.length}`);
    console.log(`⏭️  Ignorados (já processados): ${resultados.ignorados.length}`);
    console.log(`❌ Erros: ${resultados.erros.length}`);
    console.log(`⏱️  Tempo total: ${tempoTotal}ms (${(tempoTotal / 1000).toFixed(2)}s)`);
    console.log('='.repeat(70));
    console.log('');

    if (resultados.processados.length > 0) {
      console.log('📋 Carrinhos processados neste scan:');
      resultados.processados.forEach((item, index) => {
        console.log(`   ${index + 1}. Carrinho ${item.carrinho_id} - ${item.cliente} (Pedido #${item.pedido_id})`);
      });
      console.log('');
    }

    if (resultados.ignorados.length > 0) {
      console.log(`⏭️  ${resultados.ignorados.length} carrinhos foram ignorados (já processados anteriormente)`);
      console.log('');
    }

    if (resultados.erros.length > 0) {
      console.log('❌ Erros encontrados:');
      resultados.erros.forEach((item, index) => {
        console.log(`   ${index + 1}. Carrinho ${item.carrinho_id}: ${item.erro}`);
      });
      console.log('');
    }

    console.log('✅ SCAN AUTOMÁTICO CONCLUÍDO!');
    console.log('');
    console.log('💡 Próximos passos:');
    console.log('   1. Execute novamente para ver que os carrinhos serão ignorados');
    console.log('   2. Faça deploy na Vercel: git push origin main');
    console.log('   3. O Vercel Cron rodará a cada 15 minutos automaticamente');
    console.log('');

    // Mostrar estatísticas
    const stats = ControleProcessamento.getEstatisticas();
    console.log('📈 Estatísticas:');
    console.log(`   Total de carrinhos processados (histórico): ${stats.total_processados}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ERRO NO SCAN AUTOMÁTICO');
    console.error('='.repeat(70));
    console.error('');
    console.error('Mensagem:', error.message);
    console.error('');
    
    if (error.response) {
      console.error('Resposta da API:');
      console.error('  Status:', error.response.status);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('');
    process.exit(1);
  }
}

// Executar
testarScanAutomatico();
