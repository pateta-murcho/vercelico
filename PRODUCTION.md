# 🚀 Sistema Magazord → GoHighLevel - PRODUÇÃO

Sistema de integração automática entre Magazord e GoHighLevel com monitoramento completo de pedidos e carrinhos.

## 📊 Status Monitorados

### Pedidos (6 status)
- **0** - Cancelado (automático)
- **1** - Aguardando Pagamento
- **2** - Pagamento Expirado
- **3** - Pago
- **4** - Aprovado
- **7** - Cancelado (manual)

### Carrinhos (3 status)
- **1** - Aberto (montado, não foi p/ checkout)
- **2** - Abandonado (foi p/ checkout, não pagou)
- **3** - Comprado

## 🔗 Endpoints em Produção

**Base URL:** `https://plapla.vercel.app`

### Pedidos
- `GET /scan-pedidos` - Busca pedidos recentes (status 0,1,2,3,4,7)
- `POST /webhook-status` - Recebe webhooks do Magazord

### Carrinhos
- `GET /auto-scan` - Scan automático (status 2,3) - **Cron diário 9h**
- `GET /scan-carrinhos-abandonados` - Apenas status 2
- `GET /scan-carrinhos-abertos` - Apenas status 1

### Sistema
- `GET /` ou `/health` - Health check

## 🛡️ Recursos de Produção

### ✅ Tratamento de Erros
- **Retry automático** (3 tentativas com backoff exponencial)
- **Validação de dados** antes de processar
- **Fallback** para campos vazios
- **Logs estruturados** (timestamp + contexto)

### ✅ Validações Obrigatórias
- Email OU Telefone (obrigatório)
- Pedido com itens
- Dados mínimos de pessoa

### ✅ Timeouts
- Requisições: 30 segundos
- Retry delays: 1s, 2s, 4s (exponential backoff)

### ✅ Logs
- Sucesso: `✅ [timestamp] Mensagem`
- Erro: `❌ [timestamp] Mensagem + detalhes`
- Warning: `⚠️ [timestamp] Mensagem`
- Retry: `[Retry] Tentativa X/3`

## 📦 Estrutura JSON Final

```json
{
  "tipo_evento": "string",
  "pedido_id": 0,
  "pedido_codigo": "string",
  
  "status": {
    "codigo": 0,
    "descricao": "string",
    "descricao_simples": "string",
    "explicacao": "string (opcional)"
  },
  
  "pessoa": {
    "nome": "string",
    "email": "string",
    "telefone": "string"
  },
  
  "pedido": {
    "valor_total": "decimal",
    "forma_pagamento": "string",
    "link_pagamento": "string|null",
    "itens": []
  },
  
  "entrega": {
    "codigo_rastreio": "string",
    "transportadora": "string",
    "tem_codigo_rastreio": boolean,
    "tem_transportadora": boolean,
    "tem_previsao_entrega": boolean,
    "endereco_entrega": {}
  }
}
```

## 🔧 Configuração Magazord

### Webhook URL
Configure no painel Magazord:
```
https://plapla.vercel.app/webhook-status
```

### Eventos para escutar
- Pedido criado
- Status atualizado
- Pagamento confirmado
- Rastreio adicionado

## ⚙️ Variáveis de Ambiente

Não são necessárias! Credenciais já configuradas no código.

## 📊 Monitoramento

### Logs no Vercel
```bash
vercel logs --follow
```

### Testar Health Check
```bash
curl https://plapla.vercel.app/health
```

## 🚨 Erros Tratados

### API Magazord
- ✅ **500/502/503** - Retry automático
- ✅ **Timeout** - Retry com backoff
- ✅ **Dados inválidos** - Skip com log
- ✅ **Carrinho sem pessoa** - Ignorado
- ✅ **Pedido sem itens** - Ignorado
- ✅ **Formato inesperado** - Validação + fallback

### Comportamento
```javascript
// Se falhar após 3 tentativas:
- Loga erro completo
- Continua próximo registro
- Retorna resumo (processados/erros/ignorados)
```

## 📈 Performance

- **Timeout por requisição:** 30s
- **Retry máximo:** 3 tentativas
- **Delay entre retries:** 1s → 2s → 4s
- **Processamento:** Sequencial (evita rate limit)

## 🎯 GoHighLevel

### Campos Principais
- `identificador_unico` - Para deduplicação
- `status.codigo` - Número do status (0-7)
- `status.descricao_simples` - Para workflows
- `tem_*` flags - Para condicionais

### Exemplo de Workflow
```javascript
if (status.codigo === 1) {
  // Aguardando pagamento
  if (link_pagamento) {
    // Enviar email com link
  }
}

if (status.codigo === 4) {
  // Aprovado
  if (tem_previsao_entrega) {
    // Enviar boas-vindas com previsão
  }
}
```

## 📞 Suporte

Sistema pronto para produção com:
- ✅ Retry automático
- ✅ Validação de dados
- ✅ Logs estruturados
- ✅ Tratamento de erros robusto
- ✅ Fallback para campos vazios

**Última atualização:** 2025-12-09
**Versão:** 1.0 (Produção)
