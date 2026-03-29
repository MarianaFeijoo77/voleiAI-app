# VôleiAI 🏐

> Análise de vôlei com inteligência artificial para treinadores brasileiros.

Plataforma SaaS que transforma filmagens de partidas em relatórios táticos e estatísticas de jogadores — sem precisar de analista de dados.

## Problema Resolvido

Treinadores de clubes no Brasil precisam de análises táticas mas não têm acesso a ferramentas como DataVolley (€3.000+/ano, em inglês, requer analista treinado). O VôleiAI democratiza esse acesso.

## Arquitetura

Ver `docs/architecture.md` para diagrama completo.

## Stack Tecnológica

- **API:** Node.js + Fastify + TypeScript
- **Fila:** BullMQ + Redis
- **CV Pipeline:** Python + YOLOv8 + ByteTrack (Modal.com GPU)
- **Web Dashboard:** Next.js 14 (App Router)
- **Mobile:** Flutter (em desenvolvimento)
- **Banco de Dados:** PostgreSQL + Prisma
- **Storage:** Cloudflare R2
- **Auth:** Supabase Auth

## Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Subir infraestrutura local
docker-compose up -d  # PostgreSQL + Redis

# Rodar migrations
cd packages/api && pnpm prisma migrate dev

# Rodar API
cd packages/api && pnpm dev

# Rodar web
cd packages/web && pnpm dev

# Rodar worker
cd packages/worker && pnpm dev
```

## Variáveis de Ambiente

Copie `.env.example` para `.env` em cada pacote e preencha os valores:

```bash
cp .env.example packages/api/.env
cp .env.example packages/worker/.env
```

## Planos de Assinatura

| Plano | Preço | Limites |
|-------|-------|---------|
| Gratuito | R$0 | 2 análises/mês |
| Clube | R$490/mês | Ilimitado, 3 treinadores |
| Federação | Sob consulta | Multi-clube, API |

## Roadmap MVP

- [x] Fase 0: Estrutura base, schema, autenticação
- [ ] Fase 1: Pipeline de upload e fila de processamento
- [ ] Fase 2: CV Alpha — detecção de jogadores e bola
- [ ] Fase 3: Motor de análise — relatório de rotações
- [ ] Fase 4: Frontend MVP em português
- [ ] Fase 5: Beta fechado — 5 clubes brasileiros

## Estrutura do Monorepo

```
voleiAI/
├── packages/
│   ├── api/          # Fastify API + Prisma
│   ├── worker/       # BullMQ worker de processamento
│   ├── cv-pipeline/  # Python CV service (Modal.com)
│   └── web/          # Next.js dashboard
└── docs/             # Arquitetura e decisões técnicas
```

## Documentação

- [Arquitetura](docs/architecture.md)
- [Stack Técnico](docs/tech-stack.md)
- [Riscos de CV](docs/cv-risk-register.md)
- [Estratégia de Dados](docs/data-labelling-strategy.md)
- [Sprint Semana 1](docs/week1-sprint.md)

## Status

🚧 Em desenvolvimento ativo — Fase 0
