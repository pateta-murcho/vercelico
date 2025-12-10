/**
 * Utility para retry de requisições com backoff exponencial
 */
export class RetryHelper {
  /**
   * Executa uma função com retry automático
   * @param {Function} fn - Função async para executar
   * @param {Object} options - Opções de retry
   * @returns {Promise} Resultado da função
   */
  static async executeWithRetry(fn, options = {}) {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      backoffMultiplier = 2,
      retryableErrors = [500, 502, 503, 504, 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND']
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Retry] Tentativa ${attempt}/${maxRetries}`);
        const result = await fn();
        
        if (attempt > 1) {
          console.log(`✅ [Retry] Sucesso na tentativa ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        // Verificar se o erro é retryável
        const isRetryable = this.isRetryableError(error, retryableErrors);
        
        if (!isRetryable || attempt === maxRetries) {
          console.error(`❌ [Retry] Falha definitiva após ${attempt} tentativas:`, error.message);
          throw error;
        }

        console.warn(`⚠️ [Retry] Tentativa ${attempt} falhou: ${error.message}`);
        console.log(`⏳ [Retry] Aguardando ${delay}ms antes de tentar novamente...`);
        
        await this.sleep(delay);
        
        // Aumentar delay para próxima tentativa (exponential backoff)
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError;
  }

  /**
   * Verifica se um erro é retryável
   */
  static isRetryableError(error, retryableErrors) {
    // Erro de resposta HTTP
    if (error.response?.status) {
      return retryableErrors.includes(error.response.status);
    }

    // Erro de rede
    if (error.code) {
      return retryableErrors.includes(error.code);
    }

    // Timeout ou erro de conexão
    if (error.message) {
      const msg = error.message.toLowerCase();
      return msg.includes('timeout') || 
             msg.includes('econnreset') || 
             msg.includes('network') ||
             msg.includes('socket');
    }

    return false;
  }

  /**
   * Sleep helper
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Validador de dados da API Magazord
 */
export class DataValidator {
  /**
   * Valida se um carrinho tem os dados mínimos necessários
   */
  static validateCarrinho(carrinho) {
    const errors = [];

    if (!carrinho) {
      errors.push('Carrinho é null ou undefined');
      return { valid: false, errors };
    }

    if (!carrinho.id) {
      errors.push('Carrinho sem ID');
    }

    if (!carrinho.status) {
      errors.push('Carrinho sem status');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida se um pedido tem os dados mínimos necessários
   */
  static validatePedido(pedido) {
    const errors = [];

    if (!pedido) {
      errors.push('Pedido é null ou undefined');
      return { valid: false, errors };
    }

    if (!pedido.id && !pedido.codigo) {
      errors.push('Pedido sem ID ou código');
    }

    if (!pedido.pessoaId) {
      errors.push('Pedido sem pessoa associada');
    }

    // Verificar se tem itens
    const itens = pedido.arrayPedidoRastreio?.[0]?.pedidoItem || [];
    if (itens.length === 0) {
      errors.push('Pedido sem itens');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida se uma pessoa tem os dados mínimos necessários
   */
  static validatePessoa(pessoa) {
    const errors = [];

    if (!pessoa) {
      errors.push('Pessoa é null ou undefined');
      return { valid: false, errors };
    }

    if (!pessoa.id) {
      errors.push('Pessoa sem ID');
    }

    if (!pessoa.nome) {
      errors.push('Pessoa sem nome');
    }

    const email = pessoa.email || '';
    const contatos = pessoa.pessoaContato || [];
    const temTelefone = contatos.some(c => c.contato);

    if (!email && !temTelefone) {
      errors.push('Pessoa sem email nem telefone (obrigatório para GHL)');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: []
    };
  }

  /**
   * Valida dados completos (carrinho + pedido + pessoa)
   */
  static validateDadosCompletos(dados) {
    const errors = [];
    const warnings = [];

    if (!dados) {
      return { valid: false, errors: ['Dados completos são null'], warnings };
    }

    // Validar carrinho (se presente)
    if (dados.carrinho) {
      const carrinhoValidation = this.validateCarrinho(dados.carrinho);
      if (!carrinhoValidation.valid) {
        errors.push(...carrinhoValidation.errors);
      }
    }

    // Validar pedido
    const pedidoValidation = this.validatePedido(dados.pedido);
    if (!pedidoValidation.valid) {
      errors.push(...pedidoValidation.errors);
    }

    // Validar pessoa
    const pessoaValidation = this.validatePessoa(dados.pessoa);
    if (!pessoaValidation.valid) {
      errors.push(...pessoaValidation.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Logger para produção
 */
export class Logger {
  static log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  static error(message, error = null) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${message}`);
    if (error) {
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }

  static warn(message, data = null) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] ⚠️ ${message}`);
    if (data) {
      console.warn(data);
    }
  }

  static success(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ✅ ${message}`);
    if (data) {
      console.log(data);
    }
  }
}
