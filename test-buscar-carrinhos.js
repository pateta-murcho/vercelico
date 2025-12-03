/**
 * Teste simples - Busca carrinhos reais da API Magazord e processa
 */

import { MagazordService } from './src/services/magazord.service.js';
import { TransformerService } from './src/services/transformer.service.js';
import { GHLService } from './src/services/ghl.service.js';

console.log('='.repeat(70));
console.log('🧪 TESTE LOCAL - MAGAZORD → GHL');
console.log('='.repeat(70));
console.log('');

async function testar() {
  try {
    // URL de teste do webhook.site para visualizar os dados
    const GHL_WEBHOOK_TESTE = 'https://webhook.site/unique-url';
    
    console.log('ℹ️  Este teste vai:');
    console.log('   1. Buscar carrinhos REAIS da API Magazord (status 2 ou 3)');
    console.log('   2. Pegar o primeiro carrinho encontrado');
    console.log('   3. Coletar todos os dados (carrinho → pedido → pessoa)');
    console.log('   4. Transformar para o formato GHL');
    console.log('   5. Mostrar o resultado na tela');
    console.log('');
    console.log('⚠️  IMPORTANTE: Para enviar para GHL de verdade, mude a URL do webhook');
    console.log('   Ou use https://webhook.site para criar um webhook de teste');
    console.log('');
    console.log('-'.repeat(70));
    console.log('');

    // Inicializar serviços
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();

    // Passo 1: Buscar carrinhos da API
    console.log('📡 [1/4] Buscando carrinhos da API Magazord...');
    const carrinhos = await magazordService.listarCarrinhos(5);
    
    if (!carrinhos || carrinhos.length === 0) {
      console.log('');
      console.log('⚠️  NENHUM CARRINHO ENCONTRADO');
      console.log('   Não há carrinhos com status 2 ou 3 no Magazord no momento.');
      console.log('   Crie um carrinho de teste no painel do Magazord.');
      console.log('');
      return;
    }

    console.log(`✅ Encontrados ${carrinhos.length} carrinhos`);
    console.log('');
    console.log('📋 Carrinhos disponíveis:');
    carrinhos.forEach((c, index) => {
      console.log(`   ${index + 1}. Carrinho ID: ${c.id} | Status: ${c.status} | Pedido: ${c.pedido?.codigo || 'N/A'}`);
    });
    console.log('');

    // Pegar o primeiro carrinho que tenha pedido associado
    const carrinhoComPedido = carrinhos.find(c => c.pedido && c.pedido.codigo);
    
    if (!carrinhoComPedido) {
      console.log('');
      console.log('⚠️  NENHUM CARRINHO COM PEDIDO ASSOCIADO');
      console.log('   Os carrinhos encontrados não possuem pedidos.');
      console.log('   Complete um pedido no Magazord para testar.');
      console.log('');
      return;
    }

    const carrinhoId = carrinhoComPedido.id;

    console.log(`🎯 Processando carrinho ID: ${carrinhoId} (tem pedido: ${carrinhoComPedido.pedido.codigo})`);
    console.log('');

    // Passo 2: Coletar dados completos (passando os dados do carrinho que já temos)
    console.log('📡 [2/4] Coletando dados completos do Magazord...');
    const dadosMagazord = await magazordService.coletarDadosCompletos(carrinhoId, carrinhoComPedido);
    console.log('✅ Dados coletados:');
    console.log(`   - Carrinho: ${dadosMagazord.carrinho.id}`);
    console.log(`   - Pedido: ${dadosMagazord.pedido.id} (Código: ${dadosMagazord.pedido.codigo})`);
    console.log(`   - Pessoa: ${dadosMagazord.pessoa.nome} (${dadosMagazord.pessoa.email})`);
    console.log('');

    // Passo 3: Transformar dados
    console.log('🔄 [3/4] Transformando dados para formato GHL...');
    const dadosTransformados = transformerService.transformarDados(
      carrinhoId,
      dadosMagazord
    );
    console.log('✅ Dados transformados com sucesso');
    console.log('');

    // Passo 4: Mostrar resultado
    console.log('📊 [4/4] RESULTADO FINAL (JSON que será enviado ao GHL):');
    console.log('');
    console.log(JSON.stringify(dadosTransformados, null, 2));
    console.log('');

    console.log('-'.repeat(70));
    console.log('');
    console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('');
    console.log('📝 Resumo:');
    console.log(`   - Carrinho ID: ${dadosTransformados.carrinho_id}`);
    console.log(`   - Pedido ID: ${dadosTransformados.pedido_id}`);
    console.log(`   - Cliente: ${dadosTransformados.pessoa.nome}`);
    console.log(`   - Email: ${dadosTransformados.pessoa.email}`);
    console.log(`   - Valor Total: R$ ${dadosTransformados.pedido.valor_total}`);
    console.log(`   - Itens no pedido: ${dadosTransformados.pedido.itens.length}`);
    console.log('');
    console.log('🚀 Próximo passo:');
    console.log('   Para enviar para o GHL de verdade, use:');
    console.log('   node test-enviar-ghl.js ' + carrinhoId + ' <URL_DO_WEBHOOK_GHL>');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('❌ ERRO NO TESTE');
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
    console.error('💡 Dicas:');
    console.error('   - Verifique se as credenciais do Magazord estão corretas');
    console.error('   - Confirme se há carrinhos com status 2 ou 3 no sistema');
    console.error('   - Verifique sua conexão com a internet');
    console.error('');
    process.exit(1);
  }
}

// Executar teste
testar();
