/**
 * Teste completo - Busca carrinho e ENVIA para o GHL
 * Uso: node test-enviar-ghl.js <carrinho_id> <webhook_ghl_url>
 */

import { MagazordService } from './src/services/magazord.service.js';
import { TransformerService } from './src/services/transformer.service.js';
import { GHLService } from './src/services/ghl.service.js';

console.log('='.repeat(70));
console.log('🚀 TESTE COMPLETO - ENVIAR PARA GHL');
console.log('='.repeat(70));
console.log('');

async function testarEnvio() {
  try {
    // Pegar parâmetros
    const carrinhoId = process.argv[2];
    const ghlWebhookUrl = process.argv[3];

    if (!carrinhoId) {
      console.error('❌ ERRO: Forneça um carrinho_id');
      console.log('');
      console.log('Uso: node test-enviar-ghl.js <carrinho_id> <webhook_ghl_url>');
      console.log('');
      console.log('Exemplos:');
      console.log('  node test-enviar-ghl.js 12345 https://webhook.site/seu-id');
      console.log('  node test-enviar-ghl.js 12345 https://services.leadconnectorhq.com/hooks/...');
      console.log('');
      console.log('💡 Dica: Use https://webhook.site para criar um webhook de teste');
      console.log('');
      process.exit(1);
    }

    if (!ghlWebhookUrl) {
      console.error('❌ ERRO: Forneça a URL do webhook GHL');
      console.log('');
      console.log('Uso: node test-enviar-ghl.js <carrinho_id> <webhook_ghl_url>');
      console.log('');
      console.log('💡 Dica: Use https://webhook.site para criar um webhook de teste');
      console.log('');
      process.exit(1);
    }

    console.log(`📦 Carrinho ID: ${carrinhoId}`);
    console.log(`🎯 Webhook GHL: ${ghlWebhookUrl}`);
    console.log('');

    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService(ghlWebhookUrl);

    // Passo 1: Coletar dados
    console.log('📡 [1/3] Coletando dados do Magazord...');
    const dadosMagazord = await magazordService.coletarDadosCompletos(carrinhoId);
    console.log('✅ Dados coletados:');
    console.log(`   - Carrinho: ${dadosMagazord.carrinho.id}`);
    console.log(`   - Pedido: ${dadosMagazord.pedido.id}`);
    console.log(`   - Cliente: ${dadosMagazord.pessoa.nome}`);
    console.log('');

    // Passo 2: Transformar dados
    console.log('🔄 [2/3] Transformando dados...');
    const dadosTransformados = transformerService.transformarDados(
      carrinhoId,
      dadosMagazord
    );
    console.log('✅ Dados transformados');
    console.log('');

    // Passo 3: Enviar para GHL
    console.log('🚀 [3/3] Enviando para GHL...');
    console.log('');
    console.log('📤 Payload enviado:');
    console.log(JSON.stringify(dadosTransformados, null, 2));
    console.log('');

    const resultado = await ghlService.enviarDados(dadosTransformados);
    
    console.log('✅ ENVIADO COM SUCESSO!');
    console.log('');
    console.log('📊 Resposta do GHL:');
    console.log(`   Status: ${resultado.status}`);
    if (resultado.data) {
      console.log(`   Data: ${JSON.stringify(resultado.data, null, 2)}`);
    }
    console.log('');

    console.log('='.repeat(70));
    console.log('✅ TESTE COMPLETO - SUCESSO!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📝 Resumo:');
    console.log(`   - Carrinho processado: ${carrinhoId}`);
    console.log(`   - Pedido: ${dadosTransformados.pedido_id}`);
    console.log(`   - Cliente: ${dadosTransformados.pessoa.nome}`);
    console.log(`   - Enviado para: ${ghlWebhookUrl}`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ERRO AO ENVIAR');
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
testarEnvio();
