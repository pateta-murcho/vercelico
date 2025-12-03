# Exemplos de Requisições para Testar o Servidor

## 1. Health Check

### cURL
```bash
curl https://seu-dominio.vercel.app/health
```

### PowerShell
```powershell
Invoke-RestMethod -Uri "https://seu-dominio.vercel.app/health" -Method Get
```

---

## 2. Processar Carrinho (POST com JSON)

### cURL
```bash
curl -X POST https://seu-dominio.vercel.app/processar \
  -H "Content-Type: application/json" \
  -d '{
    "carrinho_id": 12345,
    "ghl_webhook_url": "https://services.leadconnectorhq.com/hooks/seu-webhook-aqui"
  }'
```

### PowerShell
```powershell
$body = @{
    carrinho_id = 12345
    ghl_webhook_url = "https://services.leadconnectorhq.com/hooks/seu-webhook-aqui"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://seu-dominio.vercel.app/processar" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

### JavaScript (Fetch API)
```javascript
fetch('https://seu-dominio.vercel.app/processar', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    carrinho_id: 12345,
    ghl_webhook_url: 'https://services.leadconnectorhq.com/hooks/seu-webhook-aqui'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

---

## 3. Processar Carrinho (GET com Query Parameters)

### cURL
```bash
curl "https://seu-dominio.vercel.app/processar?carrinho_id=12345&ghl_webhook_url=https://services.leadconnectorhq.com/hooks/seu-webhook-aqui"
```

### PowerShell
```powershell
$params = @{
    carrinho_id = 12345
    ghl_webhook_url = "https://services.leadconnectorhq.com/hooks/seu-webhook-aqui"
}

$query = ($params.GetEnumerator() | ForEach-Object { 
    "$($_.Key)=$([uri]::EscapeDataString($_.Value))" 
}) -join "&"

Invoke-RestMethod -Uri "https://seu-dominio.vercel.app/processar?$query" -Method Get
```

### Navegador
```
https://seu-dominio.vercel.app/processar?carrinho_id=12345&ghl_webhook_url=https://services.leadconnectorhq.com/hooks/seu-webhook-aqui
```

---

## 4. Testar Localmente (Node.js)

### Instalar dependências
```bash
npm install
```

### Executar teste local
```bash
node test-local.js 12345
```

### Com webhook customizado
```bash
node test-local.js 12345 https://webhook.site/seu-id-unico
```

**Dica**: Use [webhook.site](https://webhook.site) para criar um webhook temporário e ver os dados sendo enviados!

---

## 5. Automatizar com Webhook do Magazord

Configure no painel do Magazord para chamar automaticamente quando um carrinho for criado/atualizado:

**URL do Webhook**: `https://seu-dominio.vercel.app/processar`

**Método**: `POST`

**Body**:
```json
{
  "carrinho_id": "{{carrinho_id}}",
  "ghl_webhook_url": "https://services.leadconnectorhq.com/hooks/seu-webhook-aqui"
}
```

---

## Respostas Esperadas

### Sucesso (200)
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

### Erro - Parâmetro faltando (400)
```json
{
  "error": true,
  "message": "Parâmetro carrinho_id é obrigatório"
}
```

### Erro - Carrinho não encontrado (500)
```json
{
  "error": true,
  "message": "Carrinho 12345 não encontrado",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```

### Erro - Status inválido (500)
```json
{
  "error": true,
  "message": "Carrinho 12345 não está com status 2 ou 3 (atual: 1)",
  "timestamp": "2025-12-03T10:30:00.000Z"
}
```
