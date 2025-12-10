import { MagazordService } from '../services/magazord.service.js';
import { TransformerService } from '../services/transformer.service.js';
import { GHLService } from '../services/ghl.service.js';

/**
 * Rota para escanear carrinhos abertos (status 1)
 * 
 * Carrinhos status 1 = Cliente montou o carrinho mas NÃO foi para o checkout
 * Útil para recuperação de carrinhos inativos
 */

/**
 * Scan manual de carrinhos abertos
 * GET /scan-carrinhos-abertos
 */
export async function scanCarrinhosAbertos(req, res) {
  console.log('\n' + '='.repeat(80));
  console.log('🛒 SCAN DE CARRINHOS ABERTOS (NÃO FINALIZADOS)');
  console.log('='.repeat(80));

  try {
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService();

    // Buscar carrinhos abertos nas últimas 6 horas
    console.log('📡 [1/3] Buscando carrinhos abertos...');
    
    const carrinhos = await magazordService.listarCarrinhosPorStatus(
      1, // Status 1 = Aberto (montou carrinho mas não foi p/ checkout)
      6  // Últimas 6 horas
    );

    if (!carrinhos || carrinhos.length === 0) {
      console.log('⚠️  Nenhum carrinho aberto encontrado');
      return res.status(200).json({
        success: true,
        message: 'Nenhum carrinho aberto encontrado',
        processados: 0
      });
    }

    console.log(`✅ Encontrados ${carrinhos.length} carrinhos abertos\n`);

    // Processar cada carrinho
    console.log('🔄 [2/3] Coletando dados completos e transformando...');
    
    let processados = 0;
    let ignorados = 0;
    let erros = 0;

    for (const carrinhoResumo of carrinhos) {
      try {
        console.log(`\n📦 Processando carrinho #${carrinhoResumo.id}...`);

        // Verificar se tem pedido associado (carrinhos abertos geralmente não têm)
        if (!carrinhoResumo.pedidoId) {
          console.log(`⚠️  Ignorado: carrinho sem pedido (ainda não foi para checkout)`);
          ignorados++;
          continue;
        }

        // Coletar dados completos
        const dadosCompletos = await magazordService.coletarDadosCompletos(carrinhoResumo.id);

        // Verificar se tem email OU telefone
        const email = dadosCompletos.pessoa?.email || '';
        const telefone = magazordService.extrairTelefone(dadosCompletos.pessoa);

        if (!email && !telefone) {
          console.log(`⚠️  Ignorado: sem email nem telefone`);
          ignorados++;
          continue;
        }

        // Transformar dados (já inclui status_carrinho com código, descrição e explicação)
        const dadosTransformados = transformerService.transformarDados(carrinhoResumo.id, dadosCompletos);
        
        // Adicionar tipo de evento
        dadosTransformados.tipo_evento = 'carrinho_aberto';

        // Enviar para GHL
        await ghlService.enviarParaGHL(dadosTransformados);
        
        console.log(`✅ Carrinho #${carrinhoResumo.id} processado e enviado ao GHL`);
        processados++;

      } catch (error) {
        console.error(`❌ Erro ao processar carrinho #${carrinhoResumo.id}:`, error.message);
        erros++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO DO SCAN');
    console.log('='.repeat(80));
    console.log(`Total encontrados: ${carrinhos.length}`);
    console.log(`✅ Processados: ${processados}`);
    console.log(`⚠️  Ignorados: ${ignorados} (sem pedido ou sem email/telefone)`);
    console.log(`❌ Erros: ${erros}`);
    console.log('='.repeat(80) + '\n');

    return res.status(200).json({
      success: true,
      message: 'Scan de carrinhos abertos concluído',
      total: carrinhos.length,
      processados,
      ignorados,
      erros
    });

  } catch (error) {
    console.error('❌ Erro no scan de carrinhos abertos:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
