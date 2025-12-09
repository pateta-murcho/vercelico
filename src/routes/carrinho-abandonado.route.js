import { MagazordService } from '../services/magazord.service.js';
import { TransformerService } from '../services/transformer.service.js';
import { GHLService } from '../services/ghl.service.js';

/**
 * Rota para escanear carrinhos abandonados (status 2)
 * 
 * Carrinhos status 2 = Cliente foi até o checkout, informou dados,
 * mas não completou o pagamento no prazo (timeout PIX, boleto, etc)
 */

/**
 * Scan manual de carrinhos abandonados
 * GET /scan-carrinhos-abandonados
 */
export async function scanCarrinhosAbandonados(req, res) {
  console.log('\n' + '='.repeat(80));
  console.log('🛒 SCAN DE CARRINHOS ABANDONADOS');
  console.log('='.repeat(80));

  try {
    const magazordService = new MagazordService();
    const transformerService = new TransformerService();
    const ghlService = new GHLService();

    // Buscar carrinhos abandonados nas últimas 6 horas
    console.log('📡 [1/3] Buscando carrinhos abandonados...');
    
    const carrinhos = await magazordService.listarCarrinhosPorStatus(
      2, // Status 2 = Abandonado (foi p/ checkout mas não pagou)
      6  // Últimas 6 horas
    );

    if (!carrinhos || carrinhos.length === 0) {
      console.log('⚠️  Nenhum carrinho abandonado encontrado');
      return res.status(200).json({
        success: true,
        message: 'Nenhum carrinho abandonado encontrado',
        processados: 0
      });
    }

    console.log(`✅ Encontrados ${carrinhos.length} carrinhos abandonados\n`);

    // Processar cada carrinho
    console.log('🔄 [2/3] Coletando dados completos e transformando...');
    
    let processados = 0;
    let ignorados = 0;
    let erros = 0;

    for (const carrinhoResumo of carrinhos) {
      try {
        console.log(`\n📦 Processando carrinho #${carrinhoResumo.id}...`);

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
        dadosTransformados.tipo_evento = 'carrinho_abandonado';

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
    console.log(`⚠️  Ignorados: ${ignorados} (sem email/telefone)`);
    console.log(`❌ Erros: ${erros}`);
    console.log('='.repeat(80) + '\n');

    return res.status(200).json({
      success: true,
      message: 'Scan de carrinhos abandonados concluído',
      total: carrinhos.length,
      processados,
      ignorados,
      erros
    });

  } catch (error) {
    console.error('❌ Erro no scan de carrinhos abandonados:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
