/**
 * Sistema de controle de carrinhos já processados
 * Evita duplicação de envios ao GHL
 */

// Armazena IDs de carrinhos já processados (em memória)
// Em produção, use um banco de dados (Redis, Supabase, etc.)
const carrinhosProcessados = new Set();

// Tempo de expiração: 30 dias
const EXPIRACAO_MS = 30 * 24 * 60 * 60 * 1000;
const carrinhoTimestamps = new Map();

export class ControleProcessamento {
  /**
   * Verifica se um carrinho já foi processado
   */
  static jaFoiProcessado(carrinhoId) {
    // Limpar expirados
    this.limparExpirados();
    
    return carrinhosProcessados.has(carrinhoId);
  }

  /**
   * Marca um carrinho como processado
   */
  static marcarComoProcessado(carrinhoId) {
    carrinhosProcessados.add(carrinhoId);
    carrinhoTimestamps.set(carrinhoId, Date.now());
    
    console.log(`✅ Carrinho ${carrinhoId} marcado como processado`);
  }

  /**
   * Remove carrinhos expirados (mais de 30 dias)
   */
  static limparExpirados() {
    const agora = Date.now();
    
    for (const [carrinhoId, timestamp] of carrinhoTimestamps.entries()) {
      if (agora - timestamp > EXPIRACAO_MS) {
        carrinhosProcessados.delete(carrinhoId);
        carrinhoTimestamps.delete(carrinhoId);
        console.log(`🗑️ Carrinho ${carrinhoId} expirado (removido do controle)`);
      }
    }
  }

  /**
   * Retorna estatísticas
   */
  static getEstatisticas() {
    this.limparExpirados();
    
    return {
      total_processados: carrinhosProcessados.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Limpa todos (útil para testes)
   */
  static limparTodos() {
    const total = carrinhosProcessados.size;
    carrinhosProcessados.clear();
    carrinhoTimestamps.clear();
    console.log(`🗑️ ${total} carrinhos removidos do controle`);
  }
}
