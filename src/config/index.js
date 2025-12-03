import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Magazord API
  magazord: {
    baseUrl: process.env.MAGAZORD_BASE_URL || 'https://urlmagazord.com.br/api/v2/site',
    username: process.env.MAGAZORD_USERNAME,
    password: process.env.MAGAZORD_PASSWORD,
    auth: null
  },

  // GoHighLevel Webhook
  ghl: {
    webhookUrl: process.env.GHL_WEBHOOK_URL
  },

  // Servidor
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // Filtros padrão
  defaults: {
    carrinhoStatus: process.env.DEFAULT_CARRINHO_STATUS || '2,3',
    daysLookback: parseInt(process.env.DEFAULT_DAYS_LOOKBACK) || 7
  }
};

// Validação
if (!config.magazord.username || !config.magazord.password) {
  console.warn(' AVISO: Credenciais Magazord não configuradas');
}

if (!config.ghl.webhookUrl) {
  console.warn(' AVISO: URL do webhook GHL não configurada');
}

// BasicAuth
if (config.magazord.username && config.magazord.password) {
  const credentials = Buffer.from(
    +"$"+()+"{config.magazord.username}:+"$"+()+"{config.magazord.password}+"$"+()+""
  ).toString('base64');
  config.magazord.auth = +"`Basic $"+()+"{credentials}+"`"+()+";
}
