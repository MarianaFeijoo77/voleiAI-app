# Registro de Decisões Técnicas — VôleiAI

> Documento de referência para cada escolha tecnológica do stack. Para cada decisão: recomendação + justificativas.

---

## 📱 Frontend Mobile: Flutter

**Decisão:** Flutter (descartado React Native)

**Justificativas:**
1. **Codebase único para Android e iOS** — sem divergências de comportamento entre plataformas, crítico para um time pequeno que não pode manter duas versões nativas
2. **Suporte excelente a upload de vídeo** — `http` + `dio` com suporte nativo a multipart e streaming; sem penalidade de bridge JS para operações de arquivo grandes (2GB+)
3. **Comunidade Flutter forte no Brasil** — maior pool de talentos disponível para contratar; eventos como FlutterConf Latin America; conteúdo técnico em português abundante

**Alternativas rejeitadas:**
- React Native: Bridge JS adiciona latência em operações de arquivo; splitting nativo mais comum
- Swift/Kotlin nativos: Custo 2x de desenvolvimento para equipe pequena

---

## 🌐 Frontend Web Dashboard: Next.js 14 (App Router)

**Decisão:** Next.js 14 com App Router (descartado Vite SPA puro)

**Justificativas:**
1. **SSR para páginas de relatório** — links compartilhados de relatórios renderizam com Open Graph, pré-visualização no WhatsApp funciona corretamente (crítico para coaches compartilharem resultados)
2. **Ecossistema React** — maior disponibilidade de componentes de visualização (Recharts, Victory, Nivo) para heatmaps e gráficos de desempenho
3. **Deploy Vercel** — zero configuração de CI para o dashboard; preview deployments por PR automaticamente

**Alternativas rejeitadas:**
- SvelteKit: Ecossistema menor, menos componentes de charts
- Remix: Menos familiar para devs brasileiros; menor comunidade

---

## ⚡ Backend API: Node.js + Fastify

**Decisão:** Node.js + Fastify (descartado Express, NestJS, Hono)

**Justificativas:**
1. **2x throughput vs Express** — benchmarks oficiais: Fastify processa ~30k req/s vs ~15k do Express; importante para endpoints de webhook e status polling durante análises
2. **TypeScript-first com schema validation** — validação de schema com JSON Schema built-in via `@fastify/type-provider-typebox`; sem necessidade de Joi/Zod adicional para validação de rotas
3. **Melhor handling assíncrono para uploads** — plugin `@fastify/multipart` é otimizado para streaming; suporte nativo a backpressure para arquivos de 2GB+

**Alternativas rejeitadas:**
- Express: Lento, sem validação nativa, ecosystem legado
- NestJS: Overhead de framework DI desnecessário para MVP; curva de aprendizado alta
- Hono: Excelente mas ecossistema menor; menos plugins disponíveis

---

## ⚙️ Fila de Processamento: BullMQ + Redis

**Decisão:** BullMQ com Redis (descartado SQS, RabbitMQ, Inngest)

**Justificativas:**
1. **Battle-tested com retry/backoff** — suporte nativo a exponential backoff, dead letter queues, job prioritization; essencial para jobs de GPU que podem falhar por timeout
2. **Relatórios de progresso em tempo real** — `job.updateProgress()` permite polling de progresso; coaches podem acompanhar "20%... 45%... 85%" durante os 20-45 min de análise
3. **Escala horizontal simples** — adicionar workers é apenas subir outro container; sem configuração de cluster; Redis gerencia coordenação automaticamente

**Alternativas rejeitadas:**
- AWS SQS: Sem progresso de job nativo; latência de polling; custo adicional
- RabbitMQ: Configuração mais complexa; overhead operacional maior
- Inngest: Ótimo DX mas custo pode escalar rapidamente; menos controle sobre infra

---

## ☁️ Storage: Cloudflare R2

**Decisão:** Cloudflare R2 (descartado AWS S3, Google Cloud Storage)

**Justificativas:**
1. **Zero egress fees** — crítico quando cada partida tem ~2GB de vídeo; com S3, egress custa $0.09/GB; com 1.000 partidas analisadas/mês = $180/mês só em egress vs $0 no R2
2. **API S3-compatível** — migração do SDK `@aws-sdk/client-s3` é zero; mesmos métodos, apenas mudar endpoint
3. **CDN global incluído** — assets de relatório (imagens, thumbnails) servidos via Cloudflare CDN sem custo adicional; ~90% mais barato que S3 em escala com vídeos

**Alternativas rejeitadas:**
- AWS S3: Egress fees proibitivos para vídeo em escala
- GCS: Egress fees similares ao S3; sem vantagem de ecossistema
- Backblaze B2: Zero egress via Cloudflare CDN também, mas API menos madura

---

## 🐘 Banco de Dados: PostgreSQL + TimescaleDB

**Decisão:** PostgreSQL 16 com extensão TimescaleDB (descartado MongoDB, PlanetScale)

**Justificativas:**
1. **Dados de séries temporais** — eventos de partida (toques, saques) têm timestamps precisos; TimescaleDB hypertables oferecem queries de janela temporal 10-100x mais rápidas que PostgreSQL puro
2. **Modelo relacional forte** — dados de clubes, treinadores, times, jogadores têm relações complexas; esquema relacional com foreign keys garante integridade; joins eficientes
3. **JSON nativo para output do CV** — coluna `cvOutputJson` armazena JSON estruturado do pipeline; queries JSONB com índices GIN; sem necessidade de banco adicional para dados semi-estruturados

**Alternativas rejeitadas:**
- MongoDB: Schema-less é desvantagem aqui; relações complexas sem joins nativos eficientes
- PlanetScale: Sem foreign keys (Vitess); não suporta extensões como TimescaleDB

---

## 🎮 Hosting de Modelos CV: Modal.com (GPU Serverless)

**Decisão:** Modal.com (descartado RunPod, Replicate, AWS SageMaker)

**Justificativas:**
1. **Cold start < 2s em H100/A10G** — pipeline de análise é assíncrono; cold start mínimo permite escalar a zero entre análises sem experiência degradada para o coach
2. **Cobrança por segundo** — sem custos idle de GPU; a análise de uma partida custa ~$0.50-2.00 em GPU time; vs $300-500/mês de GPU dedicada para volume inicial
3. **Python-native** — pipeline CV em Python puro; sem serialização de dados entre linguagens; deploys com um comando; secrets management integrado

**Alternativas rejeitadas:**
- RunPod: Cold start mais longo; menos DX amigável; sem Python-native deployment
- Replicate: Focado em modelos públicos; menos flexível para pipelines customizados multi-etapa
- AWS SageMaker: Complexidade operacional enorme; custo fixo alto; não escala a zero facilmente

---

## 🎯 Modelo CV Base: YOLOv8x (fine-tuned)

**Decisão:** YOLOv8x fine-tuned em footage de vôlei (descartado RT-DETR, YOLOv9)

**Justificativas:**
1. **SOTA para detecção de objetos pequenos** — YOLOv8x atinge mAP@50 > 90% no COCO; arquitetura CSP + C2f excelente para detecção de jogadores em alta resolução
2. **Dataset de treino disponível** — COCO inclui pessoas; fine-tune com SportsMOT + footage CBV; comunidade ativa de volleyball computer vision no roboflow universe
3. **Export ONNX para edge futuro** — rota de migração clara para análise offline no dispositivo (futuro produto) sem reescrever código de inferência

**Alternativas rejeitadas:**
- RT-DETR: Mais lento na inferência; overhead de transformer desnecessário para velocidade
- YOLOv9: Mais novo mas menos maduro; comunidade menor; poucos exemplos de fine-tuning esportivo

---

## 🏐 Ball Tracking: TrackNetV3

**Decisão:** TrackNetV3 (descartado GenericTracker, BallTrackNet)

**Justificativas:**
1. **Propósito específico para vôlei/badminton** — arquitetura treinada especificamente para bolas de alta velocidade com trajetórias não-lineares; F1-score > 85% em datasets de vôlei
2. **Melhor handling de oclusão** — usa 3 frames consecutivos como input; prediz trajetória mesmo quando bola está atrás de jogador; essencial para ataques e bloqueios
3. **Open source** — MIT license; podemos fine-tunar com footage brasileiro sem restrições; repositório ativo no GitHub

---

## 👥 Player Tracking: ByteTrack

**Decisão:** ByteTrack (descartado DeepSORT, OC-SORT, StrongSORT)

**Justificativas:**
1. **Melhor handling de oclusão** — associa detecções de baixa confiança usando trajetória histórica; jogadores que cruzam em frente à rede não são perdidos
2. **SOTA em MOT benchmarks** — HOTA > 80% no MOT17; melhor trade-off velocidade/acurácia do mercado
3. **Leve** — sem Reid network adicional para matching; funciona apenas com motion; roda em tempo real em GPU A10G mesmo com 12 jogadores simultâneos

---

## 💳 Pagamentos: MercadoPago + Stripe

**Decisão:** MercadoPago (primário) + Stripe (secundário)

**Justificativas:**
1. **MercadoPago domina o Brasil** — ~70% de market share em pagamentos online brasileiros; PIX nativo (pagamento instantâneo sem cartão); coaches de clubes amadores frequentemente sem cartão internacional
2. **PIX como método principal** — PIX tem taxa de conversão 40%+ maior que cartão para B2B no Brasil; zero chargebacks; liquidação instantânea; taxa ~0.99% vs 3-5% cartão
3. **Stripe para internacionalização futura** — confederações internacionais, coaches expatriados; Stripe é padrão de mercado para SaaS global; Radar para anti-fraude

---

## 🔐 Auth: Supabase Auth

**Decisão:** Supabase Auth (descartado Auth0, Clerk, NextAuth)

**Justificativas:**
1. **Free tier generoso** — 50k MAU gratuitos; sem custo até escala significativa; Auth0 cobra a partir de 7k MAU ($23/mês)
2. **Magic link** — coaches não-técnicos não precisam criar/lembrar senhas; login via link no email; reduz abandono no onboarding
3. **JWT compatível + templates em português** — JWT padrão integrável com Fastify; templates de email personalizáveis em português; LGPD-compliant com opção de data residency no Brasil (Supabase Cloud BR)

---

## Resumo do Stack

```
Mobile:     Flutter (Dart)
Web:        Next.js 14 + TypeScript + Tailwind CSS
API:        Fastify + TypeScript + Prisma
Worker:     Node.js + BullMQ + TypeScript
CV:         Python 3.11 + YOLOv8 + ByteTrack + TrackNetV3
Database:   PostgreSQL 16 + TimescaleDB
Cache/Queue: Redis 7
Storage:    Cloudflare R2
GPU:        Modal.com (A10G / H100)
Auth:       Supabase Auth
Payments:   MercadoPago + Stripe
Deploy:     Railway (API) + Vercel (Web) + Modal (CV)
```
