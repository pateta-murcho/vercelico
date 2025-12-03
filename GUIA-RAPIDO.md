# 🚀 Guia Rápido - Magazord → GHL

## ✅ O que foi criado

Um servidor serverless que:
1. Recebe um `carrinho_id` do Magazord
2. Busca automaticamente todos os dados relacionados (carrinho → pedido → pessoa)
3. Transforma no formato JSON específico do GHL
4. Envia via webhook para o GoHighLevel

## 📡 Como usar

### Opção 1: Chamada direta via API

```bash
curl -X POST https://seu-dominio.vercel.app/processar \
  -H "Content-Type: application/json" \
  -d '{
    "carrinho_id": 12345,
    "ghl_webhook_url": "https://services.leadconnectorhq.com/hooks/..."
  }'
```

### Opção 2: Via navegador (GET)

```
https://seu-dominio.vercel.app/processar?carrinho_id=12345&ghl_webhook_url=https://...
```

### Opção 3: Webhook automático do Magazord

Configure no painel do Magazord para chamar automaticamente seu endpoint `/processar` sempre que um carrinho for atualizado.

## 🔍 Como testar

### 1. Testar localmente (sem deploy)

```bash
# Instalar dependências
npm install

# Testar com um carrinho_id real
node test-local.js 12345

# Ver os dados sendo enviados para webhook.site
node test-local.js 12345 https://webhook.site/seu-id
```

### 2. Testar no Vercel

```bash
# Health check
curl https://seu-dominio.vercel.app/health

# Processar carrinho
curl -X POST https://seu-dominio.vercel.app/processar \
  -H "Content-Type: application/json" \
  -d '{"carrinho_id": 12345, "ghl_webhook_url": "https://webhook.site/..."}'
```

## 📋 Estrutura dos dados enviados ao GHL

```json
{
  "pedido_id": 67890,
  "carrinho_id": 12345,
  "status_carrinho": 2,
  "pessoa": {
    "nome": "João Silva",
    "email": "joao@email.com",
    "telefone": "11999999999",
    "endereco": {
      "logradouro": "Rua Exemplo",
      "numero": "123",
      "bairro": "Centro",
      "cidade": "São Paulo",
      "estado": "SP",
      "cep": "01000-000"
    }
  },
  "pedido": {
    "data_pedido": "2025-12-03T10:30:00",
    "valor_total": 150.00,
    "forma_pagamento": "Cartão de Crédito",
    "status_pedido": "Confirmado",
    "itens": [
      {
        "produto_id": 456,
        "descricao": "Produto XYZ",
        "quantidade": 2,
        "valor_unitario": 75.00,
        "valor_total": 150.00
      }
    ]
  },
  "origem": {
    "fonte": "magazord",
    "capturado_em": "2025-12-03T10:35:00.000Z"
  }
}
```

## 🔒 Validações automáticas

O servidor valida:
- ✅ `carrinho_id` é obrigatório
- ✅ `ghl_webhook_url` é obrigatório
- ✅ Carrinho existe no Magazord
- ✅ Status do carrinho é 2 ou 3 (apenas carrinhos convertidos)
- ✅ Pedido existe e está associado ao carrinho
- ✅ Pessoa/cliente existe

## 📂 Arquivos importantes

```
plapla/
├── magazord.js                    # Handler principal (entry point Vercel)
├── test-local.js                  # Script para testar localmente
├── README.md                      # Documentação completa
├── EXEMPLOS.md                    # Exemplos de requisições
├── src/
│   ├── routes/
│   │   └── carrinho.route.js     # Lógica principal de processamento
│   └── services/
│       ├── magazord.service.js   # Busca dados no Magazord
│       ├── transformer.service.js # Transforma dados para GHL
│       └── ghl.service.js        # Envia para GHL
```

## 🚀 Deploy

O projeto já está configurado para Vercel:

```bash
# Deploy de produção
vercel --prod

# Deploy de preview
vercel
```

## 🆘 Resolução de problemas

### Erro: "Carrinho não encontrado"
- Verifique se o `carrinho_id` existe no Magazord
- Confirme as credenciais de API

### Erro: "Status não é 2 ou 3"
- Apenas carrinhos convertidos (status 2 ou 3) são processados
- Verifique o status do carrinho no painel Magazord

### Erro: "Pedido não encontrado"
- O carrinho precisa ter um pedido associado
- Verifique se o fluxo de checkout foi concluído

### Erro ao enviar para GHL
- Verifique se a URL do webhook está correta
- Teste primeiro com webhook.site para debug

## 💡 Dicas

1. **Use webhook.site para debug**: Crie um webhook temporário em https://webhook.site e use como `ghl_webhook_url` para ver exatamente o que está sendo enviado

2. **Teste localmente primeiro**: Use `node test-local.js <carrinho_id>` antes de fazer deploy

3. **Logs**: Todos os erros são logados e retornados na resposta da API

4. **CORS**: Está habilitado para todas as origens, então pode chamar de qualquer frontend

## 📞 Suporte

- Verifique os logs no dashboard da Vercel
- Use o arquivo `test-local.js` para debug
- Consulte `EXEMPLOS.md` para mais exemplos de requisições
