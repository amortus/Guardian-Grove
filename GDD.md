# GDD – Guardian Grove (v0.2)

## 1. Visão Geral

**Título de Trabalho:** Guardian Grove  
**Gênero:** Simulador de criação e treinamento de criaturas com batalhas estratégicas em tempo real pausável.  
**Plataformas:** PC (Windows/Linux), com suporte planejado para consoles.  
**Estilo Visual:** Low-poly estilizado (inspiração no PS1, mas com iluminação moderna e shaders simples).  
**Público-alvo:** Fãs de simulação, estratégia e jogos de criaturas colecionáveis.  
**Diferencial:** Sistema procedural de geração de criaturas a partir de entradas externas (Relíquias de Eco), aliado a um ciclo de vida dinâmico (criação, maturação, envelhecimento e morte).

---

## 2. Lore e Ambientação

O mundo de **Aurath** é um continente repleto de energia arcana, onde civilizações antigas criaram as **Relíquias de Eco** — cristais que ressoam com músicas, palavras e vibrações. Quando ativadas no **Templo dos Ecos**, essas relíquias dão origem a **Bestas**, seres únicos e com personalidades próprias.

O jogador é um **Guardião Aprendiz**, recém-chegado ao vilarejo de **Vale Esmeralda**. Sua missão é provar seu valor criando Bestas fortes, participando de torneios e desvendando segredos das Relíquias.

### NPCs principais

- **Mestre Ruvian** – Ancião e ex-Guardião, orienta o jogador no início.
- **Liora** – Bibliotecária do Templo, explica as Relíquias de Eco e ajuda na pesquisa.
- **Dalan** – Mercador nômade, vende itens de treino, comida especial e relíquias raras.
- **Alya** – Jovem rival, também Guardiã em treinamento, aparece em torneios e eventos.

---

## 3. Criaturas (Bestas)

As criaturas são chamadas de **Bestas**, classificadas por **Linhas** (espécies principais) e **Sangues** (subvariações).

### Linhas Iniciais (10)

1. **Olgrim** – olho flutuante com tentáculos, inteligente mas frágil.
2. **Terravox** – golem de pedra, lento mas extremamente resistente.
3. **Feralis** – felino ágil, focado em velocidade e precisão.
4. **Brontis** – réptil bípede robusto, versátil e equilibrado.
5. **Zephyra** – ave veloz, especialista em esquiva.
6. **Ignar** – fera elemental de fogo, forte em poder bruto.
7. **Mirella** – criatura anfíbia, equilibrada com afinidade aquática.
8. **Umbrix** – besta das sombras, astuta e traiçoeira.
9. **Sylphid** – espírito etéreo, frágil mas com alto poder mágico.
10. **Raukor** – fera lupina, focada em lealdade e ataques críticos.

### Sangues (subvariações)

Cada Linha pode ter até 4 Sangues, alterando visual, atributos e longevidade.

**Exemplo:**
- Olgrim Pálido → maior inteligência, menos vitalidade.
- Olgrim Carmesim → técnicas de fogo, menor foco.

---

## 4. Sistemas de Jogo

### 4.1 Rotina do Guardião

O calendário é dividido em **semanas**. Opções por semana:

- **Treinar** → aumenta atributos.
- **Trabalhar** → gera moedas, aumenta atributos menores.
- **Descansar** → reduz fadiga e stress.
- **Explorar** (late game) → coleta itens raros e relíquias.

### 4.2 Atributos

- **Força (Might)**: dano físico.
- **Astúcia (Wit)**: dano de técnicas místicas.
- **Foco (Focus)**: precisão, chance de acerto.
- **Agilidade (Agility)**: velocidade de esquiva e iniciativa.
- **Resistência (Ward)**: defesa física/mágica.
- **Vitalidade (Vitality)**: HP total.

### 4.3 Estados Secundários

- **Fadiga**: sobe com treinos/trabalhos.
- **Stress**: sobe com excesso de esforço e más condições.
- **Lealdade**: determina obediência nos combates.
- **Idade**: Bestas vivem em média 3 anos in-game (varia).

### 4.4 Sistema de Batalha

- Combate em arenas laterais.
- **Barra de Essência**: energia que recarrega até 99, usada para técnicas.
- **Desobediência**: se a lealdade for baixa, a Besta pode usar outra técnica ou não atacar.

---

## 5. Relíquias de Eco (Sistema de Geração)

O jogador leva entradas externas (nome de artista, arquivo de música, string digitada) ao **Templo dos Ecos**.

- Entrada é convertida em **semente procedural**.
- Define: Linha base, Sangue, técnica inicial, afinidade elemental e até personalidade.
- Permite infinitas combinações únicas sem precisar de banco de dados protegido por IP.

---

## 6. Economia

### Moeda: Coronas

**Ganhos:**
- Trabalhos semanais
- Prêmios de torneios

**Gastos:**
- Alimentação
- Itens de treino
- Medicina
- Taxas de torneio

### Itens comuns:

- **Ração Básica** – alimento padrão, neutro.
- **Fruta Vital** – reduz stress.
- **Erva Serena** – cura fadiga.
- **Cristal de Eco** – aumenta chance de aprender técnicas.

---

## 7. Progressão e Torneios

### Torneios divididos em ranks:

- **Bronze**: Iniciante (grátis)
- **Prata**: Intermediário (300💰)
- **Ouro**: Avançado (800💰)
- **Mítico**: Elite (2000💰)

Cada vitória rende moedas, medalhas e desbloqueios.

### Eventos Especiais:

- **Festival do Eco** – torneio com Bestas raras.
- **Noite das Sombras** – torneio apenas para criaturas de afinidade sombria.
- **Expedições** – lutas contra Bestas selvagens gigantes, cooperativas (modo futuro).

---

## 8. Técnicas

### Exemplos (40 técnicas totais):

- **Investida Selvagem** (custo 15 Essência, dano físico alto).
- **Rajada Etérea** (custo 20, dano mágico médio).
- **Garra Precisa** (custo 10, alta chance de acerto).
- **Chicote Sombrio** (custo 18, drena Essência do inimigo).
- **Rugido Ancestral** (custo 25, reduz lealdade do inimigo temporariamente).
- **Asa Cortante** (custo 12, golpe rápido e fraco).
- **Muralha de Pedra** (custo 20, reduz dano recebido por 10s).
- **Explosão Ígnea** (custo 30, dano em área).
- **Espreitar** (custo 8, aumenta chance de crítico no próximo ataque).
- **Toque Curativo** (custo 22, cura Vitalidade própria).

E mais 30 técnicas únicas distribuídas entre as 10 linhas!

---

## 9. Estilo Visual e UI

- Visual inspirado em **PS1 low-poly**, mas com shaders estilizados.
- Menus como páginas de **grimório** (histórico, técnicas, atributos).
- HUD de batalha minimalista:
  - Barra de Essência central.
  - Lista de técnicas contextuais.
  - Indicador de HP/Essência.

---

## 10. Roadmap de Desenvolvimento

### ✅ Fase 1: Core Systems (COMPLETO)
- Sistema de calendário semanal
- Atributos e crescimento
- Estados secundários (fadiga, stress, lealdade)
- UI do rancho
- Sistema de trabalho e treino
- Sistema de descanso com bônus especiais

### ✅ Fase 2: Combat System (COMPLETO)
- Sistema de combate por turnos
- Barra de Essência
- 40 técnicas implementadas
- AI inimiga
- Sistema de torneios (4 ranks)
- Geração procedural de oponentes

### 🚧 Fase 3: Relíquias de Eco (PRÓXIMO)
- Sistema de geração procedural
- Templo dos Ecos
- Interface de criação

### 📋 Fase 4: Ciclo de Vida Completo
- Envelhecimento visual
- Sistema de morte
- Herança espiritual
- Cerimônia de Eco

### 📋 Fase 5: Polimento e Expansão
- Mais linhas de bestas
- Eventos especiais
- NPCs com diálogos
- Sistema de reputação

---

## 11. Bestiário Completo

### Atributos Base por Linha:

| Linha | Força | Astúcia | Foco | Agilidade | Resistência | Vitalidade | Longevidade |
|-------|-------|---------|------|-----------|-------------|------------|-------------|
| Olgrim | ★☆☆ | ★★★★ | ★★★ | ★★ | ★☆ | ★★ | 2.5 anos |
| Terravox | ★★★★ | ★☆ | ★★ | ★☆ | ★★★★★ | ★★★★ | 4 anos |
| Feralis | ★★★ | ★★ | ★★★ | ★★★★ | ★★ | ★★★ | 3 anos |
| Brontis | ★★★★ | ★★ | ★★ | ★★ | ★★★ | ★★★★ | 3.2 anos |
| Zephyra | ★★ | ★★★ | ★★★ | ★★★★★ | ★☆ | ★★ | 3 anos |
| Ignar | ★★★★★ | ★★ | ★★ | ★★★ | ★★★ | ★★★ | 2.7 anos |
| Mirella | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | ★★★ | 3 anos |
| Umbrix | ★★ | ★★★★ | ★★★ | ★★★ | ★★ | ★★★ | 3 anos |
| Sylphid | ★☆ | ★★★★★ | ★★★★ | ★★★ | ★☆ | ★★ | 2.8 anos |
| Raukor | ★★★★ | ★★ | ★★★ | ★★★ | ★★★ | ★★★ | 3.5 anos |

---

## 12. Sistema de Descanso

| Ação | Fadiga | Stress | Bônus Especial |
|------|--------|--------|----------------|
| 💤 Dormir | -40 | -10 | +50% HP e Essência |
| 🎮 Tempo Livre | -20 | -30 | Melhora Humor |
| 🚶 Passeio | -15 | -35 | +8 Lealdade |
| 🍖 Comer Bem | -25 | -15 | +30% HP |

---

## 13. Progressão do Guardião

| Nível | Título | Requisitos | Desbloqueios |
|-------|--------|------------|--------------|
| 1 | Guardião Iniciante | Início | 1 Besta, Torneio Bronze |
| 2 | Aprendiz Reconhecido | 1 vitória Bronze + 20 semanas | 2 Bestas, Trabalhos Especiais |
| 3 | Guardião Intermediário | 2 vitórias Prata | 3 Bestas, Mini-fazenda |
| 4 | Guardião de Ouro | 1 vitória Ouro | 4 Bestas, Laboratório |
| 5 | Guardião Mítico | 1 vitória Mítico | 5 Bestas, Arena Privada |
| 6 | Guardião Lendário | Desafio dos Mestres | Rancho Lendário, Relíquias Lendárias |

---

## Status da Implementação

### ✅ Implementado:
- ✅ Sistema de calendário semanal
- ✅ 10 Linhas de bestas
- ✅ 40 Técnicas únicas
- ✅ Sistema de combate por turnos
- ✅ 4 Ranks de torneios
- ✅ Sistema de atributos completo
- ✅ Estados secundários (fadiga, stress, lealdade)
- ✅ Sistema de trabalho
- ✅ Sistema de treino
- ✅ Sistema de descanso com 4 opções
- ✅ AI inimiga básica
- ✅ UI do rancho
- ✅ UI de batalha
- ✅ Sistema de salvamento (IndexedDB)

### 🚧 Em Desenvolvimento:
- Sistema de Relíquias de Eco
- NPCs com diálogos
- Eventos especiais

### 📋 Planejado:
- Ciclo de vida completo
- Herança espiritual
- Exploração
- Mais sangues (subvariações)
- Eventos aleatórios
- Sistema de reputação

---

**Documento vivo - atualizado conforme o desenvolvimento progride.**

