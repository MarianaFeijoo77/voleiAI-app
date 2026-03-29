# Plano da Sprint — Semana 1

**Objetivo:** Repo configurado, CI/CD funcionando, infraestrutura cloud provisionada, auth funcionando, schema de DB migrado, endpoint de upload aceitando arquivos.

**Critério de conclusão:** Conseguir fazer upload de um vídeo de 500MB via curl, vê-lo aparecer no R2, e ver um job na fila do Redis.

---

## Tarefas

### 🏗️ Repositório e Monorepo

- [ ] **Inicializar monorepo com pnpm workspaces**
  ```bash
  mkdir voleiAI && cd voleiAI
  pnpm init
  # Criar pnpm-workspace.yaml com packages/*
  # Criar packages/api, packages/web, packages/worker, packages/cv-pipeline
  ```
  **Responsável:** Engenheiro fundador  
  **Estimativa:** 2h

- [ ] **Configurar TypeScript base**
  ```bash
  # tsconfig.json raiz com paths compartilhados
  # tsconfig.json por pacote extendendo base
  ```
  **Estimativa:** 1h

- [ ] **Configurar .gitignore** — node_modules, .env, dist, __pycache__, *.pyc  
  **Estimativa:** 15min

- [ ] **Criar README.md inicial** com visão do produto e instruções de setup  
  **Estimativa:** 1h

### ⚙️ CI/CD com GitHub Actions

- [ ] **Criar workflow de lint + type-check em PRs**
  ```yaml
  # .github/workflows/ci.yml
  # Trigger: push para main, PR aberto
  # Jobs: lint (ESLint), type-check (tsc --noEmit), test (vitest)
  ```
  **Estimativa:** 2h

- [ ] **Criar workflow de deploy para Railway (staging)**
  ```yaml
  # Deploy automático ao merge na main
  # railway up --service api
  ```
  **Estimativa:** 1h

### ☁️ Infraestrutura Cloud

- [ ] **Provisionar Railway.app**
  - Criar projeto VôleiAI
  - Serviço: API (Fastify) — $5/mês starter
  - Plugin: PostgreSQL 16 (1GB incluso)
  - Plugin: Redis 7 (incluso)
  - Configurar variáveis de ambiente de produção
  
  **Estimativa:** 1h

- [ ] **Configurar Cloudflare R2**
  - Criar bucket `volei-videos` (localização: South America se disponível, senão auto)
  - Gerar API token com permissão `Object Read & Write`
  - Configurar CORS para aceitar upload direto do frontend
  - Testar com `aws s3 cp test.mp4 s3://volei-videos/ --endpoint-url $R2_ENDPOINT`
  
  **Estimativa:** 1h

- [ ] **Configurar Modal.com**
  - Criar conta e workspace
  - Instalar CLI: `pip install modal`
  - Autenticar: `modal token new`
  - Testar GPU hello world:
    ```python
    @app.function(gpu="T4")
    def hello_gpu():
        import torch
        return f"GPU disponível: {torch.cuda.is_available()}"
    ```
  - Criar secret `volei-ai-secrets` com credenciais R2
  
  **Estimativa:** 2h

### 🔐 Autenticação com Supabase

- [ ] **Criar projeto Supabase**
  - Região: South America (São Paulo) — reduz latência para coaches brasileiros
  - Habilitar Auth → Email → Magic Link
  - Personalizar template de email em português:
    ```
    Assunto: Seu link de acesso ao VôleiAI
    Corpo: Olá, {{name}}! Clique no link abaixo para acessar o VôleiAI...
    ```
  
  **Estimativa:** 1h

- [ ] **Implementar middleware JWT no Fastify**
  ```typescript
  // packages/api/src/lib/auth.ts
  // Validar JWT do Supabase em rotas protegidas
  // Extrair userId e email do token
  ```
  **Estimativa:** 2h

### 🐘 Schema e Migrations do Banco

- [ ] **Implementar schema Prisma completo**
  - Modelos: Club, Coach, Team, Player, Match, MatchAnalysis, Report
  - Rodar `prisma migrate dev --name init`
  - Verificar que TimescaleDB está disponível no Railway
  
  **Estimativa:** 3h

- [ ] **Criar seed do banco para desenvolvimento local**
  ```typescript
  // packages/api/prisma/seed.ts
  // 1 clube, 1 treinador, 2 times, 12 jogadores, 1 partida fictícia
  ```
  **Estimativa:** 1h

### 📤 Endpoint de Upload

- [ ] **Implementar upload multipart em 3 endpoints**
  - `POST /api/upload/iniciar` — inicia multipart no R2
  - `PUT /api/upload/parte` — faz upload de cada chunk
  - `POST /api/upload/concluir` — finaliza e enfileira job
  
  **Estimativa:** 4h

- [ ] **Testar upload end-to-end com arquivo real**
  ```bash
  # Criar arquivo de teste de 500MB
  dd if=/dev/urandom of=test-video.mp4 bs=1M count=500
  
  # Iniciar upload
  MATCH_ID=$(curl -s -X POST http://localhost:3001/api/matches \
    -H "Content-Type: application/json" \
    -d '{"data":"2024-01-15","competicao":"Teste"}' | jq -r .id)
  
  # Upload multipart (script de teste)
  node scripts/test-upload.js test-video.mp4 $MATCH_ID
  
  # Verificar no R2
  aws s3 ls s3://volei-videos/matches/$MATCH_ID/ --endpoint-url $R2_ENDPOINT
  
  # Verificar job na fila
  node scripts/check-queue.js
  ```
  **Estimativa:** 2h

### ⚡ Fila BullMQ

- [ ] **Implementar worker stub**
  ```typescript
  // packages/worker/src/index.ts
  // Recebe job, loga receipt, não processa ainda
  // Atualiza status no banco para "processando"
  ```
  **Estimativa:** 2h

- [ ] **Dashboard de fila (Bull Board)**
  ```typescript
  // Adicionar @bull-board/fastify no dev
  // Visualizar jobs em /admin/queues (protegido por auth)
  ```
  **Estimativa:** 1h

### 📝 OpenAPI Spec

- [ ] **Escrever spec OpenAPI 3.1 para todos os endpoints planejados**
  ```yaml
  # docs/openapi.yaml
  # /api/upload/* — 3 endpoints
  # /api/matches — CRUD
  # /api/reports — GET + share token
  # /api/webhooks/cv-complete — POST
  ```
  **Estimativa:** 3h

---

## Estimativa de Tempo Total

| Área | Horas |
|------|-------|
| Repositório e monorepo | 4h |
| CI/CD | 3h |
| Infraestrutura cloud | 4h |
| Autenticação | 3h |
| Schema e banco | 4h |
| Upload endpoint | 6h |
| Fila BullMQ | 3h |
| OpenAPI spec | 3h |
| **Total** | **30h** |

Para um engenheiro solo: 5-6 dias de trabalho focado.

---

## Definição de Pronto

✅ Código commitado e pushado para `main`  
✅ CI passando (lint + type-check)  
✅ API deployada na Railway (health check retorna 200)  
✅ Arquivo de 500MB uploadado via script de teste → aparece no R2  
✅ Job `video.process` visível na fila Redis após upload  
✅ Migrations do banco aplicadas em produção  
✅ Auth magic link funcionando (email de teste recebido)

---

## Riscos da Sprint 1

- **Railway + TimescaleDB:** Railway usa PostgreSQL padrão; instalar extensão TimescaleDB pode requerer permissão de superuser. Alternativa: usar Supabase como banco (já tem TimescaleDB-like extensions) ou Neon.tech.
- **R2 CORS:** Configuração de CORS no R2 para upload direto do browser pode ter quirks. Fallback: uploads sempre via API (não direto para R2).
- **Modal cold start:** Primeira execução de GPU pode levar até 60s. Workaround: pré-aquecer container via scheduled ping.

---

## Links e Recursos

- Railway: https://railway.app
- Cloudflare R2 Docs: https://developers.cloudflare.com/r2/
- Modal Docs: https://modal.com/docs
- Supabase Auth: https://supabase.com/docs/guides/auth
- BullMQ Docs: https://docs.bullmq.io
- Prisma Docs: https://www.prisma.io/docs
