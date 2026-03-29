# Registro de Riscos — Pipeline de Visão Computacional

> Os 5 riscos técnicos mais críticos do VôleiAI, com probabilidade, impacto e mitigações concretas.

---

## Metodologia

| Nível de Risco | Critério |
|----------------|----------|
| 🔴 ALTO | Pode inviabilizar o produto ou gerar resultados inutilizáveis |
| 🟡 MÉDIO | Degrada qualidade mas produto ainda funciona |
| 🟢 BAIXO | Impacto limitado; workaround disponível |

---

## Risco 1: Acurácia de Detecção da Bola

**Risco:** 🔴 ALTO  
**Probabilidade:** Alta  
**Impacto:** Crítico — toda análise de ações depende de detectar a bola corretamente

### Descrição
A bola de vôlei é rápida (até 130 km/h em ataques), pequena (~20cm de diâmetro), frequentemente ocluída por jogadores, e pode estar desfocada em câmeras de menor qualidade. Modelos genéricos de detecção falham em 40-60% dos frames em condições adversas.

### Mitigações
1. **TrackNetV3** — modelo específico para rastreamento de bolas de vôlei/badminton; F1-score > 85% em datasets esportivos vs ~45% de Hough Circles genérico
2. **Interpolação de trajetória** — quando bola não é detectada, interpola posição usando física de trajetória parabólica (não apenas linear); reduz erros de oclusão curta
3. **Detecção de confiança** — segmentos com confiança < 0.5 são sinalizados no relatório; coach vê aviso "análise parcial neste trecho"
4. **Expectativa calibrada** — v1.0 comunicará explicitamente "acurácia de 75% na detecção da bola"; coaches esperam análise de contexto, não 100% de precisão

### Métricas de Sucesso
- F1-score ≥ 0.75 em dataset de teste interno
- Taxa de toques detectados ≥ 70% de toques totais da partida
- Zero falsos relatórios de "análise completa" com confiança < 0.6

---

## Risco 2: Variabilidade de Ângulo de Câmera

**Risco:** 🔴 ALTO  
**Probabilidade:** Muito Alta — coaches filmam de onde conseguem  
**Impacto:** Alto — homografia impossível sem ângulo adequado; relatório de posicionamento inviável

### Descrição
Treinadores de clubes amadores filmam de arquibancadas, de lado da quadra, às vezes de ângulos diagonais ou muito elevados. A homografia (mapeamento de câmera para coordenadas da quadra) requer visão lateral ou levemente elevada. Ângulos incorretos geram mapeamento de quadra completamente errado.

### Mitigações
1. **Tela de onboarding com instrução visual** — antes do primeiro upload, coach vê diagrama mostrando posição ideal (lateral, ~2-3m de altura, ~meio da quadra); com foto/vídeo exemplo
2. **Falha graciosa de homografia** — algoritmo de homografia detecta quando não há suficientes pontos de referência (linhas da quadra); retorna erro claro: "Posição de câmera não ideal. Relatório de posicionamento indisponível, mas análise de ações segue normalmente"
3. **Modo câmera livre** — relatório alternativo sem coordenadas absolutas de quadra; usa referências relativas (perto da rede, linha de fundo) em vez de metros
4. **Validação no upload** — primeiro frame analisado automaticamente; se < 3 pontos de referência detectados, aviso enviado ao coach antes de processar o vídeo inteiro

### Métricas de Sucesso
- Homografia bem-sucedida em ≥ 60% dos uploads (sem intervenção)
- Modo câmera livre disponível em 100% dos casos como fallback
- Feedback de posicionamento enviado para coach em < 30s após upload

---

## Risco 3: Segmentação por Cor de Uniforme

**Risco:** 🟡 MÉDIO  
**Probabilidade:** Média  
**Impacto:** Médio — times confundidos afetam análise individual de jogadores mas análise geral de ações é preservada

### Descrição
Times com uniformes de cores similares (ex: dois times de azul, ou ambos com uniforme branco/preto) confundem algoritmos de segmentação por cor HSV. O libero (que usa cor diferente dos companheiros) pode ser mal-identificado.

### Mitigações
1. **Input de cores pelo coach** — no formulário de partida, coach seleciona cor principal do time casa e visitante; segmentação usa isso como prior (não apenas HSV genérico)
2. **Confirmação visual antes de processar** — após upload, sistema mostra 3 frames com segmentação de equipes; coach confirma "Sim, estão corretos" ou ajusta manualmente qual time é qual
3. **Detecção do libero por processo de eliminação** — uma vez identificados os padrões de cor de cada time, jogador com cor discrepante dentro do time = libero; reduz falsos positivos
4. **Correção manual no relatório** — no dashboard, coach pode arrastar jogadores entre times; correções alimentam dataset de treinamento

### Métricas de Sucesso
- Acurácia de segmentação de times ≥ 85% em cores claramente distintas
- ≥ 70% em cores similares (com input do coach)
- Tempo de correção manual < 2 minutos por partida quando necessário

---

## Risco 4: Custo de GPU em Escala

**Risco:** 🟡 MÉDIO  
**Probabilidade:** Média (risco cresce com crescimento de usuários)  
**Impacto:** Médio — pode comprometer margem; mas Modal.com oferece controle granular

### Descrição
Uma partida de vôlei dura ~2h. Se a GPU A10G processar em tempo real (1:1), são 2h de GPU = ~$3.00 por partida. Com 1.000 partidas/mês = $3.000/mês de GPU + margem negativa no plano Clube (R$490 ≈ $100).

### Mitigações
1. **Profiling antes do lançamento** — testar pipeline em 10 partidas completas para medir GPU time real; otimizar para < 20 min de GPU time por partida
2. **Frame-skipping inteligente** — detectar apenas 1 a cada 3 frames para bola e jogadores na maior parte do vídeo; processar todos os frames apenas em janelas de ±5s ao redor de eventos detectados
3. **Pré-processamento com FFmpeg** — normalizar vídeo para 720p/30fps antes de enviar para GPU; reduz resolução desnecessária; FFmpeg é CPU, não GPU
4. **Budget per job** — configurar timeout de 45 min no Modal; job acima disso é cancelado com relatório parcial; evita runaway costs por vídeos corrompidos

### Target de Custo
- Meta: < $1.50 de GPU por partida analisada
- Breakeven no plano Clube com ≥ 70 análises/mês/clube

### Métricas de Sucesso
- GPU time médio por partida < 20 minutos
- Custo de infraestrutura < 30% da receita MRR

---

## Risco 5: Dados de Treino Rotulados

**Risco:** 🔴 ALTO  
**Probabilidade:** Alta — não existe dataset público de vôlei brasileiro rotulado  
**Impacto:** Alto — sem dados, modelo não aprende ações específicas do vôlei (levantamento vs defesa, etc.)

### Descrição
YOLOv8 detecta pessoas mas não sabe o que elas estão fazendo. Classificar ações de vôlei (saque, recepção, levantamento, ataque, bloqueio, defesa) requer dados rotulados específicos do esporte. Datasets públicos esportivos existem para futebol (SoccerNet) mas não há equivalente para vôlei brasileiro.

### Mitigações
1. **Bootstrap sintético** — Blender + simulação de física de vôlei para gerar 200h de footage sintética anotada automaticamente; transfer learning a partir daí
2. **Datasets públicos adaptáveis:**
   - SportsMOT — inclui sequências de vôlei para tracking
   - VS-ReID — volleyball re-identification dataset
   - Footage CBV no YouTube (uso educacional, público)
3. **Rotulagem na beta** — ver `data-labelling-strategy.md` para estratégia detalhada
4. **Heurísticas de posição como fallback** — classificador baseado em regras de posição na quadra (linha de fundo = saque; próximo à rede = ataque/bloqueio) como v0; funciona sem dados rotulados com acurácia ~55-65%

### Métricas de Sucesso
- Fase 0: Classificador por heurísticas com acurácia ≥ 55% (viável para MVP)
- Fase 1: Com 500 partidas rotuladas, atingir acurácia ≥ 75%
- Fase 2: Loop de aprendizado ativo mantém melhoria de ≥ 2% por mês

---

## Matriz de Risco Resumida

| # | Risco | Probabilidade | Impacto | Nível | Mitigação Principal |
|---|-------|--------------|---------|-------|---------------------|
| 1 | Detecção da bola | Alta | Crítico | 🔴 ALTO | TrackNetV3 + interpolação |
| 2 | Ângulo de câmera | Muito Alta | Alto | 🔴 ALTO | Onboarding + fallback gracioso |
| 3 | Cor de uniforme | Média | Médio | 🟡 MÉDIO | Input coach + confirmação visual |
| 4 | Custo de GPU | Média | Médio | 🟡 MÉDIO | Frame-skipping + profiling |
| 5 | Dados rotulados | Alta | Alto | 🔴 ALTO | Sintético + heurísticas + beta |

---

## Revisão

Este registro deve ser revisado a cada sprint. Riscos mitigados são marcados como resolvidos; novos riscos identificados são adicionados.

**Última revisão:** Semana 0 (pré-MVP)  
**Próxima revisão:** Semana 4 (pós-pipeline inicial)
