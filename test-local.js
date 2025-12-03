/**
 * Arquivo de exemplo para testar o servidor localmente
 * Execute com: node test-local.js
 */

import { MagazordService } from './src/services/magazord.service.js';
import { TransformerService } from './src/services/transformer.service.js';
import { GHLService } from './src/services/ghl.service.js';

async function testarFluxo() {
  console.log('='.repeat(60));
  console.log('TESTE DO FLUXO MAGAZORD → GHL');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Configurar parâmetros de teste
    const CARRINHO_ID_TESTE = process.argv[2] || null;
    const GHL_WEBHOOK_URL_TESTE = process.argv[3] || 'https://webhook.site/unique-url'; // Use webhook.site para testes

    if (!CARRINHO_ID_TESTE) {
      console.error('❌ ERRO: Forneça um carrinho_id como parâmetro');
      console.log('');
      console.log('Uso: node test-local.js <carrinho_id> [ghl_webhook_url]');
      console.log('');
      console.log('Exemplo:');
      console.log('  node test-local.js 12345');
      console.log('  node test-local.js 12345 https://webhook.site/seu-id');
      process.exit(1);
    }

    console.log(`📦 Carrinho ID: ${CARRINHO_ID_TESTE}`);
    console.log(`🎯 Webhook GHL: ${GHL_WEBHOOK_URL_TESTE}`);
    console.log('');

    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(GHL_WEBHOOK_URL_TESTE);

    // Passo 1: Coletar dados do Magazord
    console.log('📡 [1/3] Coletando dados do Magazord...');
    const dadosMagazord = await magazordService.coletarDadosCompletos(CARRINHO_ID_TESTE);
    console.log('✅ Dados coletados com sucesso');
    console.log('   - Carrinho:', dadosMagazord.carrinho.id);
    console.log('   - Pedido:', dadosMagazord.pedido.id);
    console.log('   - Pessoa:', dadosMagazord.pessoa.nome);
    console.log('');

    // Passo 2: Transformar dados
    console.log('🔄 [2/3] Transformando dados...');
    const dadosTransformados = transformerService.transformarDados(
      CARRINHO_ID_TESTE,
      dadosMagazord
    );
    console.log('✅ Dados transformados com sucesso');
    console.log('');
    console.log('📋 Estrutura final:');
    console.log(JSON.stringify(dadosTransformados, null, 2));
    console.log('');

    // Passo 3: Enviar para GHL
    console.log('🚀 [3/3] Enviando para GHL...');
    const resultado = await ghlService.enviarDados(dadosTransformados);
    console.log('✅ Enviado com sucesso para GHL');
    console.log('   Status:', resultado.status);
    console.log('');

    console.log('='.repeat(60));
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ ERRO NO TESTE');
    console.error('='.repeat(60));
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

// Executar teste
testarFluxo();
