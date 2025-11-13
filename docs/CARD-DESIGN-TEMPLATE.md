# 🎴 KARDUM - Template de Design de Cartas

## 📝 Como Usar Este Template

1. Copie o template da seção correspondente ao tipo de carta
2. Preencha todas as informações
3. Teste balance usando a calculadora de poder
4. Submeta para revisão da comunidade
5. Se aprovado, será adicionado ao jogo!

---

## 🎯 Guidelines de Balance

### Curva de Mana (Custo de Recursos)

```
Custo 1: Cartas fracas, rápidas
Custo 2-3: Base do deck (70%)
Custo 4-5: Cartas fortes, virada de jogo
Custo 6-7: Cartas poderosas, finishers
Custo 8-10: Lendárias, game-changers
```

### Fórmula de Poder (Defenders)

```
Poder Total = (ATK × 1.5) + HP + Efeitos

Custo 1 = 3-4 poder
Custo 2 = 5-6 poder
Custo 3 = 7-9 poder
Custo 4 = 10-12 poder
Custo 5 = 13-15 poder
Custo 6+ = 16+ poder

Exemplos:
- Custo 2: ATK 2, HP 3 = (2×1.5) + 3 = 6 poder ✅
- Custo 3: ATK 3, HP 4 = (3×1.5) + 4 = 8.5 poder ✅
- Custo 4: ATK 5, HP 5 = (5×1.5) + 5 = 12.5 poder ✅
```

### Raridade

```
Common (70%):   Cartas básicas, sem efeitos complexos
Rare (20%):     Efeitos interessantes, combos
Epic (8%):      Efeitos únicos, build-around
Legendary (2%): Game-changers, definem arquétipos
```

---

## 📋 TEMPLATE: GENERAL (Herói)

### Informações Básicas

```yaml
# ID único (sem espaços, lowercase)
id: general_warrior_marcus

# Nome da carta (como aparece no jogo)
name: "Comandante Marcus"

# Tipo (sempre 'general')
type: general

# Classe (define quais habilidades pode usar)
class: warrior  # warrior, mage, rogue, druid, etc.

# Raça (define sinergia com outras cartas)
race: human  # human, orc, elf, dwarf, deva

# Custo (sempre 0 para General)
cost: 0

# Stats
attack: 3      # 2-4 (General não é atacante principal)
health: 30     # 25-35 (HP principal do jogador)
maxHealth: 30  # Igual a health inicial

# Habilidade Especial (única do General)
ability:
  id: warrior_rage
  name: "Fúria de Batalha"
  description: "Todos seus Defenders ganham +1 ATK até o fim do turno."
  cost: 3  # Custo em recursos
  cooldown: 0  # Turnos de cooldown (0 = pode usar todo turno)
  effect:
    type: buff
    target: all_allies
    stat: attack
    value: 1
    duration: 1  # Em turnos

# Raridade (Generals são sempre Common no starter)
rarity: common

# Descrição
description: "General humano especializado em fortalecer suas tropas."

# Lore (opcional)
lore: "Marcus liderou a defesa de Vale Esmeralda por 20 anos."

# Arte (caminho do arquivo)
imageUrl: "/assets/cards/generals/warrior_marcus.png"
```

### Balance Check

```
✅ HP entre 25-35? SIM (30)
✅ ATK entre 2-4? SIM (3)
✅ Habilidade útil mas não OP? SIM (+1 ATK temporário é ok)
✅ Custo da habilidade justo? SIM (3 recursos é médio)
```

---

## 📋 TEMPLATE: DEFENDER (Soldado)

### Informações Básicas

```yaml
# ID único
id: defender_orc_berserker

# Nome
name: "Berserker Orc"

# Tipo
type: defender

# Raça
race: orc

# Custo
cost: 4

# Stats
attack: 5
health: 4

# Habilidades Especiais
abilities:
  - id: charge
    name: "Investida"
    description: "Pode atacar no turno que entra em campo."
    passive: true
  
  # Outras habilidades possíveis:
  # - taunt (obriga inimigo atacar)
  # - divine_shield (ignora primeiro dano)
  # - lifesteal (cura ao atacar)
  # - windfury (ataca 2 vezes)
  # - stealth (não pode ser alvo até atacar)

# Raridade
rarity: rare

# Descrição
description: "Guerreiro orc que ataca imediatamente!"

# Lore
lore: "Orcs não esperam ordens para entrar em combate."

# Arte
imageUrl: "/assets/cards/defenders/orc_berserker.png"
```

### Balance Check

```
Poder = (5 × 1.5) + 4 = 11.5 poder
Custo 4 = 10-12 poder esperado ✅

Habilidade "Charge" vale +1-2 custo
Então seria equivalente a custo 5-6 sem habilidade ✅

✅ Balanced!
```

### Exemplo: Defender Tank

```yaml
id: defender_dwarf_guardian
name: "Guardião Anão"
type: defender
race: dwarf
cost: 3
attack: 1
health: 7
abilities:
  - id: taunt
    name: "Provocar"
    description: "Inimigos devem atacar esta carta primeiro."
    passive: true
rarity: common
description: "Muro impenetrável de pedra e aço."
lore: "Anões da Montanha Férrea são conhecidos por sua resistência."
imageUrl: "/assets/cards/defenders/dwarf_guardian.png"
```

Balance:
```
Poder = (1 × 1.5) + 7 = 8.5 poder
Custo 3 = 7-9 poder esperado ✅
Taunt é habilidade defensiva, não aumenta custo ✅
```

---

## 📋 TEMPLATE: ABILITY (Habilidade)

### Informações Básicas

```yaml
# ID único
id: ability_fireball

# Nome
name: "Bola de Fogo"

# Tipo
type: ability

# Classe (apenas Generais desta classe podem usar)
class: mage

# Custo
cost: 4

# Efeito
effect:
  type: damage
  value: 5
  target: enemy_single  # enemy_single, enemy_all, ally, self

# Raridade
rarity: common

# Descrição
description: "Causa 5 de dano a um inimigo."

# Lore
lore: "A magia elemental mais básica, porém devastadora."

# Arte
imageUrl: "/assets/cards/abilities/fireball.png"
```

### Balance Check

```
Custo 4 = 5 dano direto ✅
Regra: 1 custo = 1-1.5 dano direto
4 custo = 4-6 dano esperado
5 dano está dentro da faixa ✅
```

### Exemplo: Habilidade de Cura

```yaml
id: ability_heal
name: "Toque Curativo"
type: ability
class: druid
cost: 3
effect:
  type: heal
  value: 5
  target: ally
rarity: common
description: "Cura 5 de vida em um aliado ou General."
lore: "A natureza provê para aqueles que a respeitam."
imageUrl: "/assets/cards/abilities/heal.png"
```

Balance:
```
Custo 3 = 5 cura ✅
Regra: 1 custo = 1.5-2 cura
3 custo = 4.5-6 cura esperado
5 cura está dentro da faixa ✅
```

### Exemplo: Habilidade de Área (AOE)

```yaml
id: ability_flame_storm
name: "Tempestade de Chamas"
type: ability
class: mage
cost: 7
effect:
  type: damage
  value: 3
  target: enemy_all  # Atinge TODOS inimigos
rarity: epic
description: "Causa 3 de dano a TODOS inimigos (incluindo General)."
lore: "O céu se torna inferno."
imageUrl: "/assets/cards/abilities/flame_storm.png"
```

Balance:
```
Custo 7 = 3 dano em todos ✅
Se atingir 4 alvos = 12 dano total
Muito poder, mas custo alto justifica ✅
```

---

## 📋 TEMPLATE: EQUIPMENT (Equipamento)

### Informações Básicas

```yaml
# ID único
id: equipment_sword_of_iron

# Nome
name: "Espada de Ferro"

# Tipo
type: equipment

# Em quem pode equipar
attachTo: defender  # defender, general, or both

# Custo
cost: 2

# Bônus
attackBonus: 2
healthBonus: 0

# Efeitos Extras (opcional)
effects:
  - type: on_attack
    description: "30% de chance de causar +1 dano extra."
    trigger: attack
    chance: 0.3
    damage: 1

# Raridade
rarity: common

# Descrição
description: "+2 ATK para um Defender."

# Lore
lore: "Forjada nas fundições de Vale Esmeralda."

# Arte
imageUrl: "/assets/cards/equipment/sword_iron.png"
```

### Balance Check

```
Custo 2 = +2 stat ✅
Regra: 1 custo = +1-1.5 stats
2 custo = +2-3 stats
+2 ATK está ok ✅
```

### Exemplo: Equipment Defensivo

```yaml
id: equipment_steel_armor
name: "Armadura de Aço"
type: equipment
attachTo: both  # Pode equipar em Defender OU General
cost: 3
attackBonus: 0
healthBonus: 4
effects:
  - type: passive
    description: "Reduz todo dano recebido em 1."
    effect: damage_reduction
    value: 1
rarity: rare
description: "+4 HP. Reduz dano em 1."
lore: "Proteção dos paladinos de Lumina."
imageUrl: "/assets/cards/equipment/steel_armor.png"
```

---

## 📋 TEMPLATE: MOUNT (Montaria)

### Informações Básicas

```yaml
# ID único
id: mount_warhorse

# Nome
name: "Cavalo de Guerra"

# Tipo
type: mount

# Custo
cost: 4

# Stats se usado como Defender
defender_mode:
  attack: 3
  health: 4
  abilities:
    - id: charge
      name: "Investida"

# Stats se usado como Equipment
equipment_mode:
  attachTo: defender
  attackBonus: 1
  healthBonus: 1
  effects:
    - type: passive
      description: "Defender ganha habilidade Charge."

# Raridade
rarity: rare

# Descrição
description: "Escolha: Invocar como criatura 3/4 com Charge OU equipar para dar +1/+1 e Charge a um Defender."

# Lore
lore: "Montaria leal de cavaleiros humanos."

# Arte
imageUrl: "/assets/cards/mounts/warhorse.png"
```

### Balance Check

```
Modo Defender: (3 × 1.5) + 4 = 8.5 poder + Charge = ~10 poder ✅
Modo Equipment: +1/+1 + Charge = ~3 custo de valor ✅
Custo 4 é justo para versatilidade ✅
```

---

## 📋 TEMPLATE: CONSUMABLE (Consumível)

### Informações Básicas

```yaml
# ID único
id: consumable_healing_potion

# Nome
name: "Poção de Cura"

# Tipo
type: consumable

# Custo
cost: 2

# Efeito
effect:
  type: heal
  value: 5
  target: self  # Cura o General

# Raridade
rarity: common

# Descrição
description: "Cura 5 de vida no seu General. Destroi após uso."

# Lore
lore: "Elixir alquímico de emergência."

# Arte
imageUrl: "/assets/cards/consumables/healing_potion.png"
```

### Exemplo: Consumível de Dano

```yaml
id: consumable_bomb
name: "Bomba Explosiva"
type: consumable
cost: 5
effect:
  type: damage
  value: 6
  target: enemy_general  # Dano direto no General
rarity: rare
description: "Causa 6 de dano direto no General inimigo."
lore: "Invenção dos alquimistas Gnômicos."
imageUrl: "/assets/cards/consumables/bomb.png"
```

---

## 🎨 Guidelines Visuais

### Paleta de Cores por Tipo

```
General:    #e74c3c (vermelho)
Defender:   #3498db (azul)
Equipment:  #95a5a6 (cinza)
Mount:      #f39c12 (laranja)
Consumable: #2ecc71 (verde)
Ability:    #9b59b6 (roxo)
```

### Layout da Carta

```
┌─────────────────┐
│ [Custo]    [⭐]│ ← Custo (canto sup. esq.) + Raridade
│                 │
│   [ILUSTRAÇÃO]  │ ← Arte principal (60% da carta)
│                 │
│─────────────────│
│ Nome da Carta   │ ← Nome (fonte bold)
│─────────────────│
│ Descrição do    │ ← Efeito (2-3 linhas)
│ efeito aqui.    │
│─────────────────│
│ [ATK] [HP]      │ ← Stats (se aplicável)
└─────────────────┘

Dimensões: 256x360px
Formato: PNG com transparência
```

---

## ✅ Checklist de Submissão

Antes de submeter sua carta, verifique:

### Design
- [ ] ID único (sem conflitos com cartas existentes)
- [ ] Nome criativo e temático
- [ ] Descrição clara e sem ambiguidade
- [ ] Lore interessante (opcional mas recomendado)

### Balance
- [ ] Passou no teste de poder (fórmula acima)
- [ ] Custo justo para o efeito
- [ ] Não é obviamente OP ou UP
- [ ] Comparado com cartas similares

### Implementação
- [ ] Arquivo YAML válido
- [ ] Todos campos obrigatórios preenchidos
- [ ] Arte disponível (ou placeholder)
- [ ] Efeitos implementáveis no engine

### Diversão
- [ ] Carta é interessante de jogar?
- [ ] Cria decisões táticas?
- [ ] Não é frustrante de enfrentar?
- [ ] Encaixa em pelo menos 1 arquétipo de deck?

---

## 📤 Como Submeter

### Opção 1: GitHub Issue
```
1. Vá em Issues
2. Clique "New Issue"
3. Use template "Nova Carta"
4. Cole o YAML da carta
5. Adicione imagem (se tiver)
6. Envie!
```

### Opção 2: Discord
```
1. Entre no servidor Discord
2. Vá no canal #card-design
3. Poste o YAML + imagem
4. Comunidade vota e discute
```

### Opção 3: Pull Request
```
1. Fork o repositório
2. Adicione carta em client/src/data/community-cards/
3. Adicione arte em client/public/assets/cards/
4. Abra PR com descrição detalhada
```

---

## 🏆 Cartas Aprovadas

Cartas com +10 votos positivos da comunidade entram no jogo!

**Créditos**: Seu nome aparece na carta e no hall da fama.

**Recompensas**:
- Carta gratuita na sua coleção (em 3 cópias)
- Badge especial "Card Designer"
- Prioridade em futuros designs

---

## 📚 Exemplos de Cartas Bem Desenhadas

### Exemplo 1: Combo Potential

```yaml
id: defender_echo_mage
name: "Mago do Eco"
type: defender
race: elf
cost: 3
attack: 2
health: 3
abilities:
  - id: echo_spell
    description: "Quando você joga uma Ability, há 30% de chance de devolvê-la à sua mão."
    trigger: on_ally_ability_played
    chance: 0.3
rarity: epic
description: "2/3. Habilidades têm 30% de chance de voltar à mão."
```

**Por que é boa**:
- ✅ Habilidade única e interessante
- ✅ Não é OP (apenas 30% de chance)
- ✅ Cria arquétipo "Spell Deck"
- ✅ Interações divertidas

### Exemplo 2: Build-Around

```yaml
id: defender_tribal_chief
name: "Chefe Tribal Orc"
type: defender
race: orc
cost: 5
attack: 4
health: 5
abilities:
  - id: orc_synergy
    description: "Seus outros Orcs ganham +1/+1."
    passive: true
    aura: true
rarity: rare
description: "4/5. Seus outros Orcs ganham +1/+1."
```

**Por que é boa**:
- ✅ Incentiva deck temático (Tribal Orc)
- ✅ Stats ok mesmo sem sinergia
- ✅ Recompensa construção criativa
- ✅ Não é polarizada (funciona em vários decks)

---

## 🚫 Erros Comuns

### ❌ Carta Overpower

```yaml
# MAL DESENHADA
id: defender_god_mode
name: "Titã Imortal"
cost: 5
attack: 10  # MUITO ALTO!
health: 10  # MUITO ALTO!
abilities:
  - divine_shield
  - taunt
  - lifesteal
rarity: legendary
```

**Problema**: Poder = (10×1.5) + 10 = 25 poder para custo 5!  
Esperado: ~13-15 poder.  
**Solução**: Reduzir para 6/6 ou aumentar custo para 8-9.

### ❌ Carta Chata

```yaml
# MAL DESENHADA
id: ability_destroy_all
name: "Apocalipse"
cost: 10
effect:
  type: destroy
  target: enemy_all  # Destroi tudo do oponente
```

**Problema**: Não é divertido perder tudo de uma vez.  
**Solução**: Fazer efeito gradual ou condicional.

### ❌ Carta Confusa

```yaml
# MAL DESENHADA
id: defender_complicated
name: "Mago Quântico"
cost: 4
attack: 3
health: 4
abilities:
  - id: quantum
    description: "No início do seu turno, se você tiver um número par de cartas na mão e o oponente tiver menos de 15 HP mas mais que 7, este defender ganha +2 ATK até..."
```

**Problema**: Texto muito longo e condição complexa demais.  
**Solução**: Simplificar para "No início do turno, ganhe +1 ATK."

---

## 💡 Dicas de Design

### 1. Simples é Melhor
```
✅ "Causa 3 de dano"
❌ "Causa 3 de dano, ou 5 se o alvo tiver mais de 4 HP, ou 2 se..."
```

### 2. Sinergia > Poder Bruto
```
✅ "Outros Elfos ganham +1 ATK"
❌ "Este defender tem 20 ATK"
```

### 3. Counterplay Existe
```
✅ "Taunt. 1/7" (pode ser removido com habilidades)
❌ "Imune a tudo" (sem counterplay)
```

### 4. Lore Importa
```
✅ Nome + efeito fazem sentido temático
   "Arqueiro Elfo" - preciso, ataca de longe
❌ "Arqueiro Elfo" - corpo-a-corpo tank
```

### 5. Teste, Teste, Teste
```
✅ Jogue com a carta 10+ vezes
✅ Peça feedback da comunidade
✅ Ajuste baseado em dados
```

---

**Boa sorte criando cartas incríveis para KARDUM! 🎴✨**

Qualquer dúvida, pergunte no Discord ou abra uma Issue!

