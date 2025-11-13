# 📊 USO REAL DOS 6 ATRIBUTOS NO GUARDIAN GROVE

## ✅ **TODOS OS 6 ATRIBUTOS ESTÃO SENDO USADOS!**

---

## 🎯 **1. MIGHT (Força)** - ⚔️ Dano Físico

### **Uso Principal:**
- **Cálculo de Dano Físico:**
  ```typescript
  baseDamage += attrs.might * 0.8
  // Might 50 → +40 dano
  // Might 100 → +80 dano
  ```

### **Impacto no Jogo:**
- ✅ Aumenta dano de técnicas **físicas** (Investida, Mordida, Golpe Poderoso)
- ✅ **80% do valor** de Might é adicionado ao dano base
- ✅ Escala **muito bem** em late game

### **Treinamento:**
- ⚙️ `train_might` - Aumenta Might ao treinar
- 🏋️ Warehouse work - Ganha Might trabalhando

---

## 🧠 **2. WIT (Astúcia)** - 🔮 Dano Místico + Essência

### **Uso Principal:**
- **Cálculo de Dano Místico:**
  ```typescript
  baseDamage += attrs.wit * 0.6 + attrs.focus * 0.4
  // Wit 100 + Focus 100 → +100 dano místico
  ```
- **Essência Máxima:**
  ```typescript
  maxEssence = ((wit + focus) / 2) + 30
  // Wit 50 + Focus 50 → 80 essência máxima
  // Wit 100 + Focus 100 → 130 essência máxima
  ```

### **Impacto no Jogo:**
- ✅ Aumenta dano de técnicas **místicas** (Raio Arcano, Explosão Mística)
- ✅ **60% do valor** de Wit é adicionado ao dano místico
- ✅ **Aumenta pool de Essência** (mais técnicas por batalha)
- ✅ Essencial para builds de "mago"

### **Treinamento:**
- 📚 `train_wit` - Aumenta Wit ao treinar
- 📖 Library work - Ganha Wit trabalhando

---

## 🎯 **3. FOCUS (Foco)** - 🎯 Precisão + Crítico + Essência

### **Uso Principal:**
- **Chance de Acerto:**
  ```typescript
  focusBonus = (attackerFocus / 100) * 0.12
  // Focus 50 → +6% de precisão
  // Focus 100 → +12% de precisão
  ```
- **Chance de Crítico:**
  ```typescript
  focusBonus = (focus / 100) * 0.15
  // Focus 50 → +7.5% de crítico (total 12.5%)
  // Focus 100 → +15% de crítico (total 20%)
  ```
- **Multiplicador de Crítico:**
  ```typescript
  critMultiplier = 1.5 + (focus / 200)
  // Focus 100 → 2.0x de dano em críticos
  ```
- **Essência Máxima:**
  ```typescript
  maxEssence = ((wit + focus) / 2) + 30
  ```

### **Impacto no Jogo:**
- ✅ **Aumenta precisão** (acerta mais)
- ✅ **Aumenta chance de crítico**
- ✅ **Aumenta dano crítico**
- ✅ **Aumenta pool de Essência**
- ✅ **STAT MAIS VERSÁTIL** - útil para qualquer build

### **Treinamento:**
- 🎯 `train_focus` - Aumenta Focus ao treinar

---

## 💨 **4. AGILITY (Agilidade)** - 🏃 Esquiva + Crítico

### **Uso Principal:**
- **Esquiva:**
  ```typescript
  agilityPenalty = (defenderAgility / 100) * 0.30
  // Agility 50 → -15% de ser atingido
  // Agility 100 → -30% de ser atingido (inimigo erra mais)
  ```
- **Chance de Crítico:**
  ```typescript
  agilityBonus = (agility / 100) * 0.10
  // Agility 50 → +5% de crítico
  // Agility 100 → +10% de crítico
  ```

### **Impacto no Jogo:**
- ✅ **Esquiva MUITO MAIOR** (30% de redução de acerto inimigo)
- ✅ **Aumenta chance de crítico** (synergy com Focus)
- ✅ Essencial para builds de "tank evasivo"
- ✅ Reduz dano recebido ao **evitar golpes**

### **Treinamento:**
- 🏃 `train_agility` - Aumenta Agility ao treinar

---

## 🛡️ **5. WARD (Resistência)** - 🛡️ Defesa Plana

### **Uso Principal:**
- **Redução de Dano:**
  ```typescript
  defense = defAttrs.ward * 0.5
  baseDamage = Math.max(1, baseDamage - defense)
  // Ward 50 → -25 dano recebido
  // Ward 100 → -50 dano recebido
  ```

### **Impacto no Jogo:**
- ✅ **Reduz TODOS os tipos de dano** (físico e místico)
- ✅ **50% do valor** de Ward é subtraído do dano
- ✅ Essencial para builds de "tank defensivo"
- ✅ **Combina com Agility** (esquiva + defesa = invencível)

### **Treinamento:**
- 🛡️ `train_ward` - Aumenta Ward ao treinar
- 🛡️ Guard work - Ganha Ward trabalhando

---

## ❤️ **6. VITALITY (Vitalidade)** - ❤️ HP Máximo

### **Uso Principal:**
- **HP Máximo:**
  ```typescript
  maxHp = Math.floor(vitality * 3 + 50)
  // Vitality 30 → 140 HP
  // Vitality 50 → 200 HP
  // Vitality 100 → 350 HP
  ```

### **Impacto no Jogo:**
- ✅ **CADA ponto de Vitality = +3 HP máximo**
- ✅ Aumenta sobrevivência em batalhas longas
- ✅ Essencial para builds de "bruiser" (tank + dano)
- ✅ **Mais tempo vivo = mais turnos atacando**

### **Treinamento:**
- ❤️ `train_vitality` - Aumenta Vitality ao treinar

---

## 📊 **RESUMO DE IMPACTO:**

| Atributo | Impacto Principal | Impacto Secundário | Builds Ideais |
|----------|------------------|-------------------|---------------|
| **Might** | Dano Físico (+80%) | - | Lutador, Bruiser |
| **Wit** | Dano Místico (+60%) | Essência Máxima | Mago, Híbrido |
| **Focus** | Precisão (+12%), Crítico (+15%) | Essência, Crit Damage | TODOS (versátil) |
| **Agility** | Esquiva (-30%), Crítico (+10%) | - | Tank Evasivo, Assassino |
| **Ward** | Defesa (-50 dano) | - | Tank Defensivo |
| **Vitality** | HP Máximo (x3) | - | Bruiser, Tank |

---

## 🎮 **EXEMPLOS DE BUILDS:**

### **🗡️ Build de Lutador Físico:**
- **Might 100** → +80 dano físico
- **Vitality 80** → 290 HP
- **Ward 60** → -30 dano recebido
- **Resultado:** Tank ofensivo corpo a corpo

### **🔮 Build de Mago Místico:**
- **Wit 100** → +60 dano místico
- **Focus 100** → +12% acerto, +15% crit, +40 essência
- **Agility 60** → +6% crit, -18% ser atingido
- **Resultado:** Alto dano mágico, difícil de acertar

### **🎯 Build de Assassino Crítico:**
- **Focus 100** → +12% acerto, +15% crit, 2.0x crit damage
- **Agility 100** → +10% crit, -30% ser atingido
- **Might 60** → +48 dano físico
- **Resultado:** 35% chance de crítico com 2.0x damage, esquiva alta

### **🛡️ Build de Tank Imortal:**
- **Vitality 100** → 350 HP
- **Ward 100** → -50 dano recebido
- **Agility 80** → -24% ser atingido
- **Resultado:** Praticamente invencível

---

## ✅ **CONCLUSÃO:**

### **SIM, TODOS OS 6 ATRIBUTOS ESTÃO FUNCIONANDO!**

✅ **Might** - Usado no cálculo de dano físico  
✅ **Wit** - Usado no cálculo de dano místico E essência máxima  
✅ **Focus** - Usado em acerto, crítico, dano crítico E essência máxima  
✅ **Agility** - Usado em esquiva E chance de crítico  
✅ **Ward** - Usado em redução de dano  
✅ **Vitality** - Usado em HP máximo  

### **Sistema RPG Completo e Balanceado:**
- Cada atributo tem **múltiplas funções**
- **Focus** é o stat mais versátil (usado em 4 cálculos diferentes)
- **Synergies** entre stats (Focus + Agility = build crítico)
- **Tradeoffs** claros (Might vs Wit, Ward vs Agility)

### **Impacto Real no Gameplay:**
- Bestas com **builds diferentes** jogam **completamente diferente**
- **Escolhas de treinamento** têm **consequências reais**
- **Equipamentos** que aumentam stats **fazem diferença visível**

---

**🎉 Sistema de atributos TOTALMENTE implementado e funcional!**

