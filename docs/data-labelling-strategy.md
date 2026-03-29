# Estratégia de Rotulagem de Dados — VôleiAI

> Como construímos o dataset de treino do zero, sem dados rotulados iniciais disponíveis.

---

## Visão Geral

O maior desafio técnico do VôleiAI é a ausência de datasets de vôlei brasileiro rotulados para classificação de ações. Esta estratégia define como bootstrapar, coletar e manter dados de treino de forma sustentável e econômica.

**Meta final:** 1 milhão+ de frames rotulados com classes de ação antes do lançamento geral.

---

## Fase 0 — Bootstrap Sintético (Semanas 1–4)

**Objetivo:** Ter um modelo funcional (mesmo que com baixa acurácia) antes de qualquer dado real.

### 1.1 Geração de Dados Sintéticos com Blender

```
Ferramenta: Blender 4.x + Add-on de física de vôlei (custom)
Output: 200h de footage sintética anotada automaticamente
```

**Processo:**
- Modelar quadra de vôlei com dimensões oficiais (18m × 9m)
- Simular trajetórias físicas realistas de bola (massa 260-280g, pressão 294-318 mbar)
- Animar 12 jogadores com ciclos de movimento por posição (levantador, ponta, etc.)
- Renderizar em diferentes ângulos de câmera (lateral, levemente elevado, diagonal)
- Gerar ground truth automático: bbox de cada jogador, posição da bola, ação em andamento

**Por que funciona:** Transfer learning a partir de footage sintética para real é estabelecido em pesquisa de visão computacional (Sim-to-Real). Acurácia inicial ~55-60% é suficiente para MVP.

### 1.2 Datasets Open Source Disponíveis

| Dataset | Fonte | Conteúdo | Relevância |
|---------|-------|----------|------------|
| SportsMOT | ICCV 2023 | Tracking multi-objeto em esportes, inclui vôlei | Alta — tracking de jogadores |
| VS-ReID | arXiv | Volleyball re-identification dataset | Alta — identificação de jogadores |
| SoccerNet-v2 | CVF | 550 jogos de futebol rotulados | Média — adaptar para vôlei |
| DanceTrack | CVPR 2022 | Multi-object tracking pessoas | Média — movimento humano |
| Volleyball Activity | ICCV 2015 | 55 sequências de vôlei com ações | Alta — ações específicas de vôlei |

### 1.3 Footage Pública CBV (Confederação Brasileira de Vôlei)

```
Fonte: Canal oficial CBV no YouTube (youtube.com/@cbv_oficial)
Status legal: Público, uso educacional/pesquisa
Conteúdo: Campeonato Brasileiro, Superliga, seleção brasileira
```

**Processo de coleta:**
```bash
# Download com yt-dlp (formato 720p para economia de storage)
yt-dlp --format "bestvideo[height<=720]+bestaudio" \
       --playlist-items 1-50 \
       "https://www.youtube.com/@cbv_oficial/videos" \
       --output "data/raw/cbv/%(title)s.%(ext)s"
```

**Volume estimado:** ~500 vídeos × 2h média = 1.000h de footage

**Anotação automática fraca:** Usar YOLOv8 pré-treinado para gerar pseudo-labels de jogadores; human review só nos casos de baixa confiança (< 0.6).

---

## Fase 1 — Rotulagem com Clubes Beta (Semanas 14–20)

**Objetivo:** Dados reais de vôlei brasileiro com contexto de clube amador/semiprofissional.

### 2.1 Seleção de Clubes Beta

**Critérios de seleção:**
- 5 clubes em cidades diferentes (São Paulo, Rio, Belo Horizonte, Recife, Porto Alegre)
- Mix de categorias: adulto + sub-19 + sub-17
- Dispostos a upload regular de partidas (≥ 2 por semana)
- Treinador com WhatsApp ativo para feedback rápido

**Incentivo para clubes:** Acesso gratuito ilimitado durante beta + crédito "fundador" permanente de R$100/mês após lançamento.

### 2.2 Plataforma de Anotação: Label Studio

```bash
# Self-hosted, gratuito, sem limites de usuários
docker run -it -p 8080:8080 \
  -v $(pwd)/label-studio-data:/label-studio/data \
  heartexlabs/label-studio:latest
```

**Configuração do projeto:**
```xml
<!-- Label Studio template para ações de vôlei -->
<View>
  <Video name="video" value="$video"/>
  <VideoRectangle name="players" toName="video"/>
  <Labels name="action" toName="video">
    <Label value="saque"/>
    <Label value="recepcao"/>
    <Label value="levantamento"/>
    <Label value="ataque"/>
    <Label value="bloqueio"/>
    <Label value="defesa"/>
    <Label value="bola_livre"/>
  </Labels>
  <KeyPointLabels name="ball" toName="video">
    <Label value="bola"/>
  </KeyPointLabels>
</View>
```

### 2.3 Contratação de Anotadores

**Plataforma:** Workana (workana.com) — principal plataforma de freelancers do Brasil

**Perfil buscado:**
- Conhecimento de vôlei (jogou ou treinou)
- Disponibilidade de 20h/semana
- Capacidade de usar ferramentas web

**Estrutura de pagamento:**
- R$25/hora (acima da média da plataforma; atrai candidatos qualificados)
- 2 anotadores part-time × 20h/semana = 40h/semana de anotação
- Custo estimado: R$4.000/mês por 4 meses = R$16.000 total

**Estimativa de produtividade:**
- 1 anotador: ~100 frames/hora com pré-preenchimento automático
- 40h/semana × 100 frames/h = 4.000 frames/semana
- 16 semanas × 4.000 = 64.000 frames rotulados

### 2.4 Pipeline de Rotulagem Semi-Automática

```
1. Partida uploadada pelo clube beta
2. Modelo fraco atual gera pseudo-labels (pre-fill automático)
3. Anotador revisa e corrige (não anota do zero)
4. Labels revisadas exportadas para dataset de treino
5. Modelo re-treinado a cada 1.000 novos frames
6. Acurácia do modelo aumenta → pre-fill fica mais preciso → anotador mais rápido
```

**Meta da Fase 1:**
- 500 partidas × ~2.000 eventos/partida × 10 frames/evento = **10 milhões de frames anotados** (parcialmente automatizado)
- Dataset de alta qualidade (human-reviewed): **100.000 frames**

---

## Fase 2 — Active Learning Loop (Pós-lançamento)

**Objetivo:** O sistema melhora automaticamente com uso, sem custo adicional significativo.

### 3.1 Fila de Revisão Automática

```typescript
// Todo frame com confiança < 0.7 é enfileirado para revisão humana
if (event.confidence < 0.7) {
  await humanReviewQueue.add('review-frame', {
    matchId: event.matchId,
    frameIdx: event.frameIdx,
    currentPrediction: event.action,
    confidence: event.confidence,
  })
}
```

**Estimativa de volume:**
- v1.0 com acurácia ~75% → 25% dos eventos são enfileirados
- 1.000 partidas/mês × 200 eventos baixa confiança/partida = 200.000 revisões/mês
- 2 anotadores × 200 revisões/hora = ~1.000 horas de revisão = R$25.000/mês (insustentável)

**Solução de escala:**
- Priorizar apenas frames com confiança < 0.5 (menor confiança, maior aprendizado)
- Coaches confirmam/negam classificações diretamente no app (crowd review)
- Sistema de gamificação: coaches que revisam mais ganham desconto no plano

### 3.2 Feedback do Coach no App

```
Tela de relatório → Coach toca em evento → "Isso está correto?"
→ Sim: sinal positivo no modelo
→ Não, foi [ação correta]: dado de treino gerado
```

**Estimativa:** 5 correções por coach por partida × 500 coaches = 2.500 correções/dia = 75.000/mês.

### 3.3 Pipeline de Re-Treinamento

```python
# Executado toda madrugada de segunda-feira via Modal CRON
@app.function(schedule=modal.Cron("0 2 * * 1"))
def re_treinar_modelo():
    novos_dados = buscar_dados_desde_ultima_semana()
    if len(novos_dados) > 500:  # Só re-treina com dados suficientes
        modelo = fine_tunar_yolo(base_model="runs/best.pt", data=novos_dados)
        avaliar_em_holdout(modelo)
        if modelo.mAP > modelo_atual.mAP:
            deployer.deploy(modelo)
            notificar_equipe("Modelo atualizado! mAP: {modelo.mAP}")
```

---

## Métricas de Qualidade do Dataset

| Fase | Frames Anotados | Acurácia Esperada | Custo |
|------|----------------|-------------------|-------|
| Fase 0 (Semanas 1-4) | 50k sintéticos + 10k públicos | ~55-60% | R$0 |
| Fase 1 (Semanas 14-20) | +100k human-reviewed | ~70-75% | R$16k |
| Fase 2 (Mês 6+) | +500k crowd-reviewed | ~80-85% | R$5k/mês |

---

## Estrutura do Dataset

```
data/
├── raw/
│   ├── cbv/          # Footage pública CBV
│   ├── synthetic/    # Gerado por Blender
│   └── beta-clubs/   # Uploads dos clubes beta
├── annotated/
│   ├── train/        # 80%
│   ├── val/          # 10%
│   └── test/         # 10% (nunca usado em treino)
└── labels/
    └── volleyball_actions.yaml  # Classes em português + inglês
```

```yaml
# volleyball_actions.yaml
nc: 7
names:
  0: saque       # serve
  1: recepcao    # reception
  2: levantamento # set
  3: ataque      # attack/spike
  4: bloqueio    # block
  5: defesa      # dig/defense
  6: bola_livre  # free ball
```
