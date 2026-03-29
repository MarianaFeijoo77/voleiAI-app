# Arquitetura do Sistema — VôleiAI

## Visão Geral

O VôleiAI é uma plataforma SaaS de análise de vôlei com IA, construída em arquitetura de microsserviços assíncronos com pipeline de visão computacional em GPU cloud.

## Diagrama de Componentes e Fluxo de Dados

```mermaid
flowchart TD
    subgraph Cliente["Clientes"]
        MOB["📱 App Mobile\n(Flutter)"]
        WEB["🌐 Dashboard Web\n(Next.js 14)"]
    end

    subgraph Gateway["API Layer"]
        APIGW["🔀 API Gateway\n(Fastify + Node.js)"]
        AUTH["🔑 Auth\n(Supabase JWT)"]
    end

    subgraph Storage["Armazenamento"]
        R2["☁️ Cloudflare R2\n(Vídeos + PDFs)"]
        PG["🐘 PostgreSQL\n+ TimescaleDB\n(Dados relacionais\n+ séries temporais)"]
    end

    subgraph Queue["Fila de Processamento"]
        BULL["⚡ BullMQ\n(Job Queue)"]
        REDIS["🔴 Redis\n(State + Cache)"]
    end

    subgraph CVCloud["CV Pipeline — GPU Cloud (Modal.com)"]
        YOLO["🎯 YOLOv8x\n(Detecção de Jogadores)"]
        TRACKNET["🏐 TrackNetV3\n(Rastreamento da Bola)"]
        BYTETRACK["👥 ByteTrack\n(Rastreamento de Jogadores)"]
        CLASSIFY["🧠 Classificador de Ações\n(Saque, Ataque, Defesa...)"]
        HOMOG["📐 Homografia\n(Mapeamento da Quadra)"]
        ROTATE["🔄 Detector de Rotações\n(Formações táticas)"]
    end

    subgraph Analytics["Motor de Análise"]
        ENGINE["📊 Analytics Engine\n(Agregação de eventos)"]
        REPORT["📄 Report Generator\n(PDF + JSON)"]
    end

    subgraph Billing["Pagamentos"]
        MP["💳 MercadoPago\n(PIX + Cartão BR)"]
        STRIPE["💳 Stripe\n(Internacional)"]
    end

    %% Fluxo principal
    MOB -->|"Upload de vídeo\n(multipart/chunked)"| APIGW
    WEB -->|"Requisições REST"| APIGW
    APIGW -->|"Valida JWT"| AUTH
    APIGW -->|"Armazena vídeo"| R2
    APIGW -->|"Enfileira job"| BULL
    BULL <-->|"Estado dos jobs"| REDIS
    APIGW <-->|"CRUD"| PG

    %% Pipeline CV
    BULL -->|"video.process job"| YOLO
    YOLO --> BYTETRACK
    YOLO --> TRACKNET
    BYTETRACK --> CLASSIFY
    TRACKNET --> CLASSIFY
    CLASSIFY --> HOMOG
    HOMOG --> ROTATE
    ROTATE --> ENGINE

    %% Analytics → Storage
    ENGINE --> REPORT
    REPORT -->|"Salva PDF"| R2
    REPORT -->|"Salva análise"| PG

    %% Webhook callback
    ENGINE -->|"POST /webhooks/cv-complete"| APIGW

    %% Consulta de relatórios
    WEB -->|"Visualiza relatório"| R2
    WEB -->|"Busca dados"| PG

    %% Billing
    MOB -->|"Assinar plano"| MP
    WEB -->|"Assinar plano"| MP
    WEB -->|"Pagamento internacional"| STRIPE
    MP -->|"Webhook de pagamento"| APIGW
    STRIPE -->|"Webhook de pagamento"| APIGW

    %% Estilos
    classDef client fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20
    classDef api fill:#e3f2fd,stroke:#1565c0,color:#0d47a1
    classDef storage fill:#fff3e0,stroke:#e65100,color:#bf360c
    classDef queue fill:#fce4ec,stroke:#c62828,color:#b71c1c
    classDef cv fill:#f3e5f5,stroke:#6a1b9a,color:#4a148c
    classDef billing fill:#e8eaf6,stroke:#283593,color:#1a237e
    classDef analytics fill:#e0f2f1,stroke:#00695c,color:#004d40

    class MOB,WEB client
    class APIGW,AUTH api
    class R2,PG storage
    class BULL,REDIS queue
    class YOLO,TRACKNET,BYTETRACK,CLASSIFY,HOMOG,ROTATE cv
    class MP,STRIPE billing
    class ENGINE,REPORT analytics
```

## Fluxo Detalhado: Upload e Análise de Partida

```mermaid
sequenceDiagram
    participant Coach as 🧑‍💼 Treinador
    participant App as 📱 Flutter App
    participant API as ⚡ Fastify API
    participant R2 as ☁️ Cloudflare R2
    participant Queue as 🔴 BullMQ
    participant CV as 🎯 Modal.com GPU
    participant DB as 🐘 PostgreSQL

    Coach->>App: Seleciona vídeo da partida
    App->>API: POST /api/matches (cria partida)
    API->>DB: INSERT match (status: pendente)
    API-->>App: { matchId }

    App->>API: POST /api/upload/iniciar
    API->>R2: CreateMultipartUpload
    R2-->>API: { uploadId }
    API-->>App: { uploadId, chave }

    loop Para cada chunk de 10MB
        App->>API: PUT /api/upload/parte
        API->>R2: UploadPart
        R2-->>API: { ETag }
        API-->>App: { etag }
    end

    App->>API: POST /api/upload/concluir
    API->>R2: CompleteMultipartUpload
    API->>DB: UPDATE match (status: processando)
    API->>Queue: Enfileira video.process job
    API-->>App: { jobId, mensagem }

    App->>App: Mostra tela de progresso

    Queue->>CV: Processa vídeo (GPU A10G)
    CV->>R2: Download do vídeo
    CV->>CV: YOLOv8 + ByteTrack + TrackNetV3
    CV->>CV: Classifica ações + rotações
    CV->>API: POST /api/webhooks/cv-complete
    API->>DB: UPDATE matchAnalysis (status: concluido)
    API->>DB: INSERT report

    App->>API: GET /api/matches/{id}/status (polling)
    API-->>App: { status: "concluido" }
    App->>App: Navega para relatório
```

## Componentes de Infraestrutura

| Componente | Serviço | Tier Inicial |
|------------|---------|--------------|
| API + Worker | Railway.app | Starter ($5/mês) |
| PostgreSQL | Railway.app | 1GB incluso |
| Redis | Railway.app | Incluso |
| Storage de vídeos | Cloudflare R2 | $0.015/GB/mês |
| GPU Pipeline | Modal.com | Pay-per-second |
| Auth | Supabase | Free tier |
| CDN | Cloudflare | Free tier |
| Web Dashboard | Vercel | Free tier |

## Considerações de Escala

- **Vídeos:** Cada partida ~2GB → R2 é crítico (zero egress fees)
- **GPU:** Modal.com escala a zero entre análises — sem custos idle
- **Concorrência:** Worker suporta 3 jobs simultâneos (configurável)
- **TimescaleDB:** Hypertable para `match_events` → queries de séries temporais 10-100x mais rápidas
