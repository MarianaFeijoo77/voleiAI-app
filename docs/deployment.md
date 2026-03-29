# Guia de Deploy — VôleiAI MVP

## Pré-requisitos

- Conta GitHub (para conectar ao Vercel e Railway)
- Conta Vercel (gratuita): https://vercel.com
- Conta Railway (gratuita, $5 crédito inicial): https://railway.app
- Conta Cloudflare (para R2 storage): https://cloudflare.com

---

## Passo 1 — Publicar no GitHub

```bash
cd /caminho/para/voleiAI
git init  # se ainda não tiver git
git add .
git commit -m "feat: VôleiAI MVP inicial"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/voleiAI.git
git push -u origin main
```

---

## Passo 2 — Deploy da API (Railway)

1. Acesse https://railway.app e faça login com GitHub
2. Clique em **"New Project"** → **"Deploy from GitHub repo"**
3. Selecione o repositório `voleiAI`
4. Configure o **Root Directory**: `packages/api`

### Adicionar plugins (banco de dados + cache):
- No dashboard do projeto: **"Add Plugin"** → **PostgreSQL**
- **"Add Plugin"** → **Redis**
- Railway injeta automaticamente `DATABASE_URL` e `REDIS_URL`

### Variáveis de ambiente (Settings → Variables):
```
JWT_SECRET=gere-um-segredo-aleatorio-de-32-chars-aqui
R2_ENDPOINT=https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=sua-chave-r2
R2_SECRET_ACCESS_KEY=seu-segredo-r2
R2_BUCKET=volei-videos
MODAL_ENABLED=false
PORT=3001
WEB_BASE_URL=https://volei-ai.vercel.app
```

### Configurar migrations no primeiro deploy:
- Railway → seu serviço → **Settings** → **Custom Deploy Command**:
```
npx prisma migrate deploy && node dist/index.js
```

5. Aguarde o deploy. Anote a URL pública gerada:
   `https://voelei-ai-api-production.up.railway.app`

---

## Passo 3 — Deploy do Worker (Railway, mesmo projeto)

1. No mesmo projeto Railway: **"Add Service"** → **"GitHub Repo"**
2. Selecione o mesmo repositório `voleiAI`
3. Configure o **Root Directory**: `packages/worker`
4. **Start Command**: `node dist/index.js`
5. Mesmas variáveis de ambiente da API (Railway permite referenciar o mesmo grupo)
6. O worker fica rodando em background, processando jobs da fila BullMQ/Redis

---

## Passo 4 — Deploy do Web Dashboard (Vercel)

1. Acesse https://vercel.com e faça login com GitHub
2. **"Import Project"** → selecione o repositório `voleiAI`
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `packages/web`
4. Adicione variável de ambiente:
   ```
   NEXT_PUBLIC_API_URL=https://sua-api.up.railway.app
   API_URL=https://sua-api.up.railway.app
   ```
5. Clique em **Deploy**!
6. Você receberá uma URL como: `https://volei-ai.vercel.app`

### Atualizar a URL da API no vercel.json:
Edite `/vercel.json` e substitua o placeholder pelo URL real da sua API Railway:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://SUA-API.up.railway.app/api/:path*"
    }
  ]
}
```
Faça commit e push — Vercel deploy automaticamente.

---

## Passo 5 — Configurar Cloudflare R2 (Storage de vídeos)

> Necessário apenas para upload de vídeos reais. Para o demo mock, pode pular.

1. Acesse https://dash.cloudflare.com → **R2** → **Create Bucket**
2. Nome: `volei-videos`
3. Em **"Manage R2 API Tokens"** → **Create Token**
   - Permissões: Object Read & Write
   - Especifique o bucket `volei-videos`
4. Anote:
   - **Account ID** (aparece na URL da dashboard)
   - **Access Key ID**
   - **Secret Access Key**
5. Atualize as variáveis Railway com esses valores

---

## Passo 6 — Testar o fluxo completo

1. Abra `https://volei-ai.vercel.app` no seu celular 📱
2. Clique em **"Analisar Partida"** (ícone de câmera na home)
3. Na tela de upload, clique em **"🎮 Ver demo com dados simulados →"**
4. Aguarde ~15-30 segundos (processamento mock com dados simulados)
5. Você será redirecionado automaticamente para o relatório completo
6. Explore as abas: **Rotações**, **Jogadores**, **Eventos**
7. Clique em **"📱 Compartilhar"** para enviar via WhatsApp

---

## URLs após deploy

| Serviço | URL |
|---------|-----|
| Web Dashboard | https://volei-ai.vercel.app |
| API | https://voelei-ai-api.railway.app |
| Worker | (Railway internal) |

---

## Variáveis de ambiente — referência completa

### packages/api
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://default:pass@host:6379
JWT_SECRET=segredo-32-chars
WEBHOOK_SECRET=segredo-para-webhooks
R2_ENDPOINT=https://account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=key
R2_SECRET_ACCESS_KEY=secret
R2_BUCKET=volei-videos
MODAL_ENABLED=false
PORT=3001
NODE_ENV=production
WEB_BASE_URL=https://volei-ai.vercel.app
LOG_LEVEL=info
```

### packages/worker (mesmas do API, mais):
```env
# Tudo igual ao API
# Em produção com Modal:
MODAL_ENABLED=true
MODAL_TOKEN_ID=seu-modal-token-id
MODAL_TOKEN_SECRET=seu-modal-token-secret
```

### packages/web
```env
NEXT_PUBLIC_API_URL=https://sua-api.up.railway.app
API_URL=https://sua-api.up.railway.app
```

---

## Modo Demo vs Produção

| Feature | Demo (MODAL_ENABLED=false) | Produção (MODAL_ENABLED=true) |
|---------|---------------------------|-------------------------------|
| Upload de vídeo | Simulado (sem R2) | Real (Cloudflare R2) |
| Pipeline CV | Mock (~5-10s) | Modal.com GPU real (~20-45min) |
| Dados do relatório | Gerados aleatoriamente | Dados reais do vídeo |
| Custo | $0 | ~$2-5/partida (GPU Modal) |

---

## Próximos passos (pós-MVP)

1. **Ativar pipeline real**: configurar Modal.com + `MODAL_ENABLED=true`
2. **Auth real**: integrar Supabase Auth ou NextAuth.js (remover modo demo)
3. **Pagamentos**: MercadoPago para plano Clube (R$490/mês)
4. **App Flutter**: build nativo para Android/iOS
5. **Notificações**: WhatsApp Business API quando análise concluir
6. **PDF**: gerar relatório PDF com react-pdf ou puppeteer

---

## Solução de Problemas

**Erro: "Cannot connect to Redis"**
→ Verifique se o plugin Redis está adicionado no Railway e `REDIS_URL` está configurado.

**Erro: "Prisma migration failed"**
→ Execute manualmente: `npx prisma migrate deploy` no terminal Railway.

**Demo não funciona — "Falha ao criar partida"**
→ Verifique se a API está respondendo em `/health`. Cheque os logs do Railway.

**Relatório não carrega**
→ O worker pode não estar rodando. Verifique o serviço do worker no Railway.
