# Magazord → GoHighLevel Proxy

Mini-servidor intermediário que integra a API do Magazord com o GoHighLevel via webhook.

## 🎯 Objetivo

Coletar dados de carrinhos, pedidos e clientes do Magazord e enviar automaticamente para o GoHighLevel no formato JSON estruturado.

## 🔄 Fluxo de Dados

1. **Recebe**: `carrinho_id` via API
2. **Busca no Magazord**:
   - Dados do carrinho (validando status 2 ou 3)
   - Dados do pedido associado
   - Dados da pessoa/cliente
3. **Transforma**: Estrutura os dados no formato GHL
4. **Envia**: Para o webhook do GoHighLevel

## 📡 API Endpoints

### `GET /` ou `GET /health`
Health check do servidor.

**Resposta:**
```json
{
  "status": "ok",
  "service": "Magazord-GHL Proxy",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

### `POST /processar`
Processa um carrinho e envia para o GHL.

**Parâmetros (body ou query):**
- `carrinho_id` (obrigatório): ID do carrinho no Magazord
- `ghl_webhook_url` (obrigatório): URL do webhook do GoHighLevel

**Exemplo de requisição:**
```bash
curl -X POST https://seu-dominio.vercel.app/processar \
  -H "Content-Type: application/json" \
  -d '{
    "carrinho_id": 12345,
    "ghl_webhook_url": "https://services.leadconnectorhq.com/hooks/..."
  }'
```

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Dados processados e enviados com sucesso",
  "carrinho_id": 12345,
  "pedido_id": 67890,
  "ghl_response": {
    "success": true,
    "status": 200
  },
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

**Resposta de erro:**
```json
{
  "error": true,
  "message": "Descrição do erro",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

## 📦 Estrutura de Dados Enviada ao GHL

```json
{
  "pedido_id": 0,
  "carrinho_id": 0,
  "status_carrinho": 0,
  
  "pessoa": {
    "nome": "",
    "email": "",
    "telefone": "",
    "endereco": {
      "logradouro": "",
      "numero": "",
      "bairro": "",
      "cidade": "",
      "estado": "",
      "cep": ""
    }
  },
  
  "pedido": {
    "data_pedido": "",
    "valor_total": 0,
    "forma_pagamento": "",
    "status_pedido": "",
    "itens": [
      {
        "produto_id": 0,
        "descricao": "",
        "quantidade": 0,
        "valor_unitario": 0,
        "valor_total": 0
      }
    ]
  },
  
  "origem": {
    "fonte": "magazord",
    "capturado_em": ""
  }
}
```

## 🚀 Deploy na Vercel

O projeto já está configurado para deploy automático na Vercel.

### Comandos úteis:
```bash
# Deploy para produção
vercel --prod

# Deploy de preview
vercel
```

## 📁 Estrutura do Projeto

```
plapla/
├── magazord.js                    # Handler principal Vercel
├── vercel.json                    # Configuração Vercel
├── package.json                   # Dependências
├── src/
│   ├── routes/
│   │   └── carrinho.route.js     # Rotas e controllers
│   └── services/
│       ├── magazord.service.js   # Integração Magazord API
│       ├── transformer.service.js # Transformação de dados
│       └── ghl.service.js        # Envio para GHL
```

## 🔧 Tecnologias

- **Runtime**: Node.js
- **Framework**: Vercel Serverless Functions
- **HTTP Client**: Axios
- **Deploy**: Vercel + GitHub

## ⚙️ Configuração Magazord

- **URL Base**: `https://danajalecos.painel.magazord.com.br/api/v2/site`
- **Autenticação**: HTTP Basic Auth
- **Status de carrinho válidos**: 2 ou 3

## 📝 Notas

- O servidor valida automaticamente se o carrinho está com status 2 ou 3
- Todos os erros são logados e retornados na resposta
- O timestamp de captura é sempre em formato ISO 8601
- CORS está habilitado para todas as origens
