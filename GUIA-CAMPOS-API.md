# 📚 GUIA DE CAMPOS DA API MAGAZORD

## 🎯 RESPOSTAS PARA SUAS DÚVIDAS

### 1️⃣ FORMA DE PAGAMENTO

**Pergunta:** "mesmo com os pedidos pendentes de pagamento com os campos 'forma de pagamento' vazios?"

**Resposta:** ❌ NÃO! O campo `formaPagamentoNome` **SEMPRE vem preenchido** da API.

**Exemplos reais:**
- `"Cartão - MasterCard"`
- `"Cartão - Visa"`
- `"Pix"`
- `"Boleto Bancário"`

✅ Pode confiar: sempre terá o nome da forma de pagamento.

---

### 2️⃣ LINK DE PAGAMENTO

**Pergunta:** "o link de pagamento é independente construido desses campos ou o link já é pronto e funcional garantido (sem precisar construir o link de pagamento)?"

**Resposta:** ✅ O `linkPagamento` já vem **PRONTO e FUNCIONAL** da API!

**Regras:**
- ✅ **PIX/Boleto**: Campo vem preenchido com URL pronta
- ❌ **Cartão de Crédito**: Campo vem `null` (pagamento direto, não precisa de link)

**Exemplo de link PIX:**
```
https://danajalecos.painel.magazord.com.br/pagamento/pix/abc123...
```

💡 **Não precisa construir nada!** Basta usar o campo direto.

---

### 3️⃣ DADOS DE ENTREGA

**Pergunta:** "quando o cliente compra, ele terá os campos de entrega fornecidos ou depende da entregadora?"

**Resposta:** Depende do **momento do pedido**:

#### ✅ SEMPRE DISPONÍVEL (desde a criação do pedido):
```javascript
{
  "endereco_entrega": {
    "destinatario": "João Silva",
    "logradouro": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 45",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01234567"
  }
}
```

#### ✅ DISPONÍVEL APÓS APROVAÇÃO:
```javascript
{
  "transportadora": "J&T Express",
  "previsao_entrega": "2025-12-20 16:14:31-03"
}
```

#### ⏳ SÓ DISPONÍVEL APÓS ENVIO FÍSICO:
```javascript
{
  "codigo_rastreio": "888030190165947",
  "link_rastreio": "https://rastreio.transporte.magazord.com.br/MZ202412188446DJ"
}
```

---

## 📧 MONTANDO O EMAIL DE BOAS-VINDAS

### Cenário 1: Pedido Recém-Criado (Aguardando Pagamento)

**Campos disponíveis:**
- ✅ Nome do cliente
- ✅ Email
- ✅ Telefone
- ✅ Forma de pagamento
- ✅ Link de pagamento (se PIX/Boleto)
- ✅ Endereço completo de entrega
- ✅ Produtos comprados
- ❌ Código de rastreio (ainda não)
- ❌ Link de rastreio (ainda não)

**Email sugerido:**
```
Olá [nome]!

Seu pedido foi recebido! 🎉

📦 Pedido: [codigo]
💰 Valor: R$ [valor]
💳 Pagamento: [forma_pagamento]

[SE link_pagamento != null]
🔗 Pague agora: [link_pagamento]
[/SE]

📍 Será entregue em:
   [endereco completo]
   Previsão: [previsao_entrega]

⏳ Aguardando confirmação do pagamento...
```

---

### Cenário 2: Pedido Aprovado (Em Separação)

**Campos disponíveis:**
- ✅ Tudo do Cenário 1
- ✅ Transportadora definida
- ✅ Previsão de entrega
- ❌ Código de rastreio (ainda não)

**Email sugerido:**
```
Ótimas notícias, [nome]! 🎊

Seu pagamento foi aprovado!

📦 Pedido: [codigo]
🚚 Transportadora: [transportadora]
📅 Previsão: [previsao_entrega]

Em breve você receberá o código de rastreamento.
```

---

### Cenário 3: Pedido Enviado

**Campos disponíveis:**
- ✅ Tudo dos cenários anteriores
- ✅ Código de rastreio
- ✅ Link de rastreio

**Email sugerido:**
```
Seu pedido está a caminho! 📦✈️

📍 Código de rastreio: [codigo_rastreio]
🔗 Acompanhe: [link_rastreio]

🚚 Transportadora: [transportadora]
📅 Previsão de entrega: [previsao_entrega]
```

---

## 🔍 COMO VERIFICAR NO JSON

Agora o JSON que você recebe no GHL tem **flags de disponibilidade**:

```json
{
  "entrega": {
    "status": "rastreavel",
    
    "codigo_rastreio": "",
    "link_rastreio": "",
    "transportadora": "J&T Express",
    "previsao_entrega": "2025-12-20 16:14:31-03",
    
    "tem_codigo_rastreio": false,     // 👈 Use isso!
    "tem_link_rastreio": false,       // 👈 Use isso!
    "tem_transportadora": true,       // 👈 Use isso!
    "tem_previsao_entrega": true,     // 👈 Use isso!
    
    "endereco_entrega": {
      "destinatario": "João Silva",
      "logradouro": "Rua das Flores",
      // ... sempre disponível
    }
  }
}
```

---

## 💡 LÓGICA PARA O GHL

```javascript
// Email de boas-vindas inicial
if (tem_link_pagamento) {
  // Mostrar link de pagamento
  email += "Pague agora: " + link_pagamento;
}

// Sempre mostrar endereço (sempre disponível)
email += "Será entregue em: " + endereco_entrega;

// Mostrar transportadora se disponível
if (tem_transportadora) {
  email += "Transportadora: " + transportadora;
}

// Mostrar previsão se disponível
if (tem_previsao_entrega) {
  email += "Previsão: " + previsao_entrega;
}

// Só mostrar rastreio quando disponível
if (tem_codigo_rastreio) {
  email += "Código de rastreio: " + codigo_rastreio;
}

if (tem_link_rastreio) {
  email += "Acompanhe: " + link_rastreio;
}
```

---

## ✅ RESUMO FINAL

| Campo | Quando está disponível | Vem pronto? |
|-------|------------------------|-------------|
| `formaPagamentoNome` | ✅ Sempre | ✅ Sim |
| `linkPagamento` | ✅ Se PIX/Boleto | ✅ Sim (URL completa) |
| `endereco_entrega` | ✅ Sempre | ✅ Sim |
| `transportadora` | ⏳ Após aprovação | ✅ Sim |
| `previsao_entrega` | ⏳ Após aprovação | ✅ Sim |
| `codigo_rastreio` | ⏳ Após envio físico | ✅ Sim |
| `link_rastreio` | ⏳ Após envio físico | ✅ Sim (URL completa) |

🎯 **Conclusão:** Todos os campos vêm prontos da API. Não precisa construir nada!
