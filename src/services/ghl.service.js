import axios from 'axios';

/**
 * Serviço para enviar dados para o GoHighLevel via webhook
 */
export class GHLService {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * Envia os dados transformados para o webhook do GHL
   */
  async enviarDados(payload) {
    try {
      console.log('Enviando dados para GHL:', JSON.stringify(payload, null, 2));

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 segundos de timeout
      });

      console.log('Dados enviados com sucesso para GHL');
      return {
        success: true,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      console.error('Erro ao enviar dados para GHL:', error.message);
      
      // Capturar mais detalhes do erro
      const errorDetails = {
        success: false,
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      };

      throw new Error(`Falha ao enviar para GHL: ${JSON.stringify(errorDetails)}`);
    }
  }

  /**
   * Valida se a URL do webhook está configurada
   */
  isConfigured() {
    return !!this.webhookUrl;
  }
}
