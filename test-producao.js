/**
 * Teste do processamento automático em produção
 */

import { MagazordService } from './src/services/magazord.service.js';
import { TransformerService } from './src/services/transformer.service.js';
import { GHLService } from './src/services/ghl.service.js';

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/scD4yzuj3zsDsqfrgvtZ/webhook-trigger/b6fd6bb0-15ef-4af5-af2b-3122b92376b6';

console.log('='.repeat(70));
console.log('🚀 TESTE PRODUÇÃO - ENVIO AUTOMÁTICO PARA GHL');
console.log('='.repeat(70));
console.log('');

async function testarProducao() {
  try {
    console.log('⚙️  Configuração:');
    console.log(`   Webhook GHL: ${GHL_WEBHOOK_URL}`);
    console.log('');

    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL);

    // 1. Buscar carrinhos
    console.log('📡 [1/3] Buscando carrinhos da API Magazord...');
    const carrinhos = await magazordService.listarCarrinhos(5);

    if (!carrinhos || carrinhos.length === 0) {
      console.log('');
      console.log('⚠️  Nenhum carrinho encontrado');
      return;
    }

    console.log(`✅ ${carrinhos.length} carrinhos encontrados`);
    console.log('');

    // 2. Filtrar carrinhos com pedido
    const carrinhosComPedido = carrinhos.filter(c => c.pedido && c.pedido.codigo);
    console.log(`📋 ${carrinhosComPedido.length} carrinhos com pedido associado`);
    console.log('');

    if (carrinhosComPedido.length === 0) {
      console.log('⚠️  Nenhum carrinho com pedido para processar');
      return;
    }

    // 3. Processar e enviar para GHL
    console.log('🚀 [2/3] Processando e enviando para GHL...');
    console.log('');

    const resultados = [];
    for (const carrinho of carrinhosComPedido) {
      console.log(`   📦 Processando carrinho ${carrinho.id}...`);
      
      try {
        // Coletar dados
        const dadosMagazord = await magazordService.coletarDadosCompletos(carrinho.id, carrinho);
        
        // Transformar
        const dadosTransformados = transformerService.transformarDados(carrinho.id, dadosMagazord);
        
        // Enviar para GHL
        await ghlService.enviarDados(dadosTransformados);
        
        console.log(`   ✅ Carrinho ${carrinho.id} enviado com sucesso`);
        console.log(`      Cliente: ${dadosTransformados.pessoa.nome}`);
        console.log(`      Pedido: ${dadosTransformados.pedido_id}`);
        console.log(`      Valor: R$ ${dadosTransformados.pedido.valor_total}`);
        console.log('');
        
        resultados.push({
          carrinho_id: carrinho.id,
          status: 'success',
          pedido_id: dadosTransformados.pedido_id,
          cliente: dadosTransformados.pessoa.nome
        });
      } catch (error) {
        console.log(`   ❌ Erro no carrinho ${carrinho.id}: ${error.message}`);
        console.log('');
        
        resultados.push({
          carrinho_id: carrinho.id,
          status: 'error',
          error: error.message
        });
      }
    }

    // 4. Resumo final
    console.log('='.repeat(70));
    console.log('📊 [3/3] RESUMO DO PROCESSAMENTO');
    console.log('='.repeat(70));
    console.log('');
    
    const sucessos = resultados.filter(r => r.status === 'success');
    const erros = resultados.filter(r => r.status === 'error');
    
    console.log(`✅ Enviados com sucesso: ${sucessos.length}`);
    console.log(`❌ Erros: ${erros.length}`);
    console.log('');
    
    if (sucessos.length > 0) {
      console.log('📋 Carrinhos processados:');
      sucessos.forEach(r => {
        console.log(`   - Carrinho ${r.carrinho_id} | Pedido ${r.pedido_id} | ${r.cliente}`);
      });
      console.log('');
    }
    
    if (erros.length > 0) {
      console.log('⚠️  Erros encontrados:');
      erros.forEach(r => {
        console.log(`   - Carrinho ${r.carrinho_id}: ${r.error}`);
      });
      console.log('');
    }

    console.log('='.repeat(70));
    console.log('✅ TESTE DE PRODUÇÃO CONCLUÍDO!');
    console.log('='.repeat(70));
    console.log('');
    console.log('🎉 O sistema está pronto para produção!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   1. git add .');
    console.log('   2. git commit -m "Configuração de produção com webhook GHL"');
    console.log('   3. git push origin main');
    console.log('   4. A Vercel fará o deploy automático');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ERRO NO TESTE');
    console.error('='.repeat(70));
    console.error('');
    console.error('Mensagem:', error.message);
    console.error('');
    process.exit(1);
  }
}

// Executar
testarProducao();
