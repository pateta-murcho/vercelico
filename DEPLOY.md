# 🚀 Guia de Deploy - Vercel

## Pré-requisitos

- ✅ Conta na Vercel
- ✅ GitHub conectado à Vercel
- ✅ Projeto já está no GitHub (pateta-murcho/vercelico)

## Opção 1: Deploy Automático (Recomendado)

### O projeto já está configurado para deploy automático!

1. **Faça commit das mudanças**:
```bash
git add .
git commit -m "Implementação completa Magazord→GHL"
git push origin main
```

2. **A Vercel detecta automaticamente** e faz o deploy
3. **Acesse seu dashboard** da Vercel para ver o progresso
4. **URL do projeto** estará disponível após o deploy

## Opção 2: Deploy Manual via CLI

### 1. Instalar Vercel CLI

```bash
npm install -g vercel
```

### 2. Login na Vercel

```bash
vercel login
```

### 3. Deploy de Preview (Teste)

```bash
vercel
```

Isso cria uma URL temporária de preview para testes.

### 4. Deploy de Produção

```bash
vercel --prod
```

## Opção 3: Deploy via Dashboard da Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em "Import Project"
3. Selecione seu repositório GitHub
4. A Vercel detecta automaticamente a configuração
5. Clique em "Deploy"

## ⚙️ Configuração da Vercel

O arquivo `vercel.json` já está configurado corretamente:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "magazord.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/magazord.js"
    }
  ]
}
```

## 🧪 Testar Após Deploy

### 1. Health Check

```bash
curl https://seu-projeto.vercel.app/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "service": "Magazord-GHL Proxy",
  "timestamp": "2025-12-03T..."
}
```

### 2. Testar Processamento (com webhook.site)

```bash
curl -X POST https://seu-projeto.vercel.app/processar \
  -H "Content-Type: application/json" \
  -d '{
    "carrinho_id": 12345,
    "ghl_webhook_url": "https://webhook.site/seu-id-unico"
  }'
```

## 📊 Monitoramento

### Acessar Logs

1. Acesse https://vercel.com/dashboard
2. Selecione seu projeto
3. Clique em "Functions"
4. Clique em uma execução para ver os logs detalhados

### Logs em tempo real

```bash
vercel logs
```

ou

```bash
vercel logs --follow
```

## 🔧 Variáveis de Ambiente (Opcional)

Se quiser usar variáveis de ambiente na Vercel:

1. Dashboard → Seu Projeto → Settings → Environment Variables
2. Adicione:
   - `MAGAZORD_USERNAME` (opcional, já está hardcoded)
   - `MAGAZORD_PASSWORD` (opcional, já está hardcoded)
   - `GHL_WEBHOOK_URL` (opcional, recebe via API)

## 🌐 Domínio Customizado (Opcional)

### Adicionar domínio próprio:

1. Dashboard → Seu Projeto → Settings → Domains
2. Clique em "Add"
3. Digite seu domínio
4. Configure DNS conforme instruções

## ⚠️ Limites da Vercel (Free Tier)

- **Função**: 10s de timeout máximo
- **Invocações**: 100GB-hours/mês
- **Banda**: 100GB/mês
- **Deploy**: Ilimitado

Para este projeto, o free tier é mais que suficiente!

## 🔄 Rollback

Se algo der errado:

1. Dashboard → Deployments
2. Encontre um deploy anterior que funcionava
3. Clique nos "..." → "Promote to Production"

Ou via CLI:

```bash
vercel rollback
```

## 📱 Status do Deploy

Após cada deploy, você pode ver:

- ✅ Build Status
- ✅ Function Logs
- ✅ Analytics
- ✅ Performance metrics

## 🎉 Pronto!

Seu servidor está no ar! Use a URL fornecida pela Vercel para fazer requisições.

Exemplo de URL final:
```
https://vercelico.vercel.app/processar
```

ou se tiver domínio customizado:
```
https://seu-dominio.com/processar
```

## 🆘 Troubleshooting Deploy

### Erro: "Build failed"
- Verifique `package.json` está correto
- Confirme que `type: "module"` está presente
- Veja os logs completos no dashboard

### Erro: "Function timeout"
- Aumente o timeout no `vercel.json` (máx 10s no free tier)
- Otimize as chamadas à API do Magazord

### Erro: "Module not found"
- Confirme que todas as dependências estão em `package.json`
- Execute `npm install` localmente para verificar

### Erro: "Cannot find module"
- Verifique os paths dos imports (case-sensitive)
- Use caminhos relativos corretos

## 📞 Suporte

- Dashboard: https://vercel.com/dashboard
- Docs: https://vercel.com/docs
- Status: https://vercel-status.com
