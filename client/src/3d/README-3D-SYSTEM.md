# 🎮 Guardian Grove 3D System - Monster Rancher PS1 Style

## Overview

Sistema de visualização 3D para as Beasts, inspirado no Monster Rancher do PlayStation 1.

## Features Implementadas

### ✅ **Modelos 3D Procedurais**
- 10 criaturas únicas com geometria low-poly
- Modelos gerados proceduralmente em Three.js
- Estilo retro PS1 com iluminação moderna

### ✅ **PS1-Style Graphics**
- Sem antialiasing (retro look)
- Pixel ratio baixo
- Checkered ground (piso xadrez)
- Fog effect para profundidade
- Iluminação em 3 pontos (ambient, key, rim)

### ✅ **Animations**
- Idle breathing (respiração suave)
- Scale breathing (pulsação sutil)
- Auto-rotate camera
- Smooth camera transitions

### ✅ **Camera Controls**
- Orbit automático
- Rotate left/right manual
- Zoom in/out
- Reset camera
- Posição orbital ao redor da beast

### ✅ **Environment**
- Ground plane with checkered texture (10x10 repeat)
- Dark purple background (#2a1a3d)
- Atmospheric fog
- Three-point lighting system

## Architecture

```
BeastViewer3D
├── Scene Setup
│   ├── Camera (60° FOV)
│   ├── Lights (3-point)
│   └── Ground (checkered)
├── Beast Sprite
│   ├── Texture Loading
│   ├── Billboarding
│   └── Animations
└── Camera System
    ├── Orbit controls
    ├── Zoom controls
    └── Auto-rotate

Ranch3DUI
├── 2D/3D Toggle
├── Control Panel
│   ├── Rotate buttons
│   ├── Zoom buttons
│   ├── Auto-rotate toggle
│   └── Reset camera
└── Exit to 2D
```

## How It Works

### **1. Entering 3D Mode**
- Player clicks "🎮 Ver em 3D" button on Ranch screen
- Creates `<div>` container for Three.js renderer
- Initializes BeastViewer3D with beast data
- Loads sprite from `/assets/beasts/sprites/{line}.png`
- Starts animation loop

### **2. 3D Rendering**
- Three.js scene with sprite billboard
- Sprite uses NearestFilter for pixel-perfect rendering
- Ground plane with checkered texture
- 3-point lighting (ambient + directional + rim)
- Auto-rotate camera around beast

### **3. Controls**
- **← Girar / Girar →**: Manual camera rotation
- **🔍 + Zoom / 🔍 - Zoom**: Adjust camera distance
- **▶ Girar Auto**: Toggle auto-rotation
- **🔄 Resetar**: Reset camera to default position
- **← Voltar para 2D**: Exit 3D mode and return to 2D ranch

### **4. Animations**
- **Idle Breathing**: Vertical bobbing (sin wave)
- **Scale Breathing**: Subtle scale pulsation
- Both synced to same timing for natural look

### **5. Exiting 3D Mode**
- Click "Voltar para 2D"
- Disposes Three.js resources (geometries, materials, renderer)
- Removes DOM container
- Returns to normal 2D ranch view

## Technical Details

### **Texture Loading**
```typescript
const texture = await textureLoader.loadAsync(spritePath);
texture.magFilter = THREE.NearestFilter; // Pixel-perfect
texture.minFilter = THREE.NearestFilter;
```

### **Billboarding**
```typescript
const sprite = new THREE.Sprite(spriteMaterial);
// Sprite automatically faces camera (built-in Three.js feature)
```

### **Camera Orbit**
```typescript
const x = Math.cos(cameraAngle) * cameraDistance;
const z = Math.sin(cameraAngle) * cameraDistance;
camera.position.set(x, cameraHeight, z);
camera.lookAt(0, 1.5, 0); // Look at beast center
```

### **Idle Animation**
```typescript
const breathingOffset = Math.sin(time * 2) * 0.1;
sprite.position.y = 1.5 + breathingOffset;

const scaleBreathing = 1 + Math.sin(time * 2) * 0.05;
sprite.scale.set(3 * scaleBreathing, 3 * scaleBreathing, 1);
```

## Files

### **Core 3D System**
- `3d/BeastViewer3D.ts` - Three.js 3D viewer component
- `ui/ranch-3d-ui.ts` - UI wrapper with controls

### **Integration**
- `ui/game-ui.ts` - "Ver em 3D" button added
- `main.ts` - State management and callbacks

### **Assets Required**
- None! All models are procedurally generated in code

## Performance

- **Target FPS**: 60 FPS
- **Render calls**: ~60/second
- **Texture size**: Depends on sprite PNG size
- **Memory**: ~5-10MB per beast (texture + geometries)

## PS1 Aesthetic Checklist

- ✅ Low poly environment (simple ground plane)
- ✅ No antialiasing
- ✅ Pixelated textures
- ✅ Simple lighting
- ✅ Fog effect
- ✅ Checkered floor
- ✅ Dark moody atmosphere
- ✅ Sprite billboarding
- ✅ Low resolution feel

## Future Enhancements (Optional)

### **Potential Additions:**
1. **Walk animation**: Move beast left/right
2. **Attack animation**: Play attack sprites
3. **Multiple camera presets**: Close-up, wide shot, etc.
4. **Environment variations**: Different floors for different zones
5. **Particles**: Dust, sparkles, elemental effects
6. **Sound effects**: Footsteps, breathing, ambient
7. **Stats overlay in 3D**: Show HP/stats in 3D space
8. **Battle arena**: 3D combat visualization

### **Performance Optimizations:**
1. Texture atlasing for multiple sprites
2. Frustum culling (already handled by Three.js)
3. LOD system for distant objects
4. Lazy loading of unused beast sprites

## Monster Rancher Inspirations Used

- ✅ **Low-poly 3D models** - Modelos 3D simples e estilizados
- ✅ **Orbital camera** - Câmera gira ao redor da criatura
- ✅ **Simple animations** - Idle breathing e rotação suave
- ✅ **Dark background** - Fundo escuro/roxo
- ✅ **Checkered floor** - Piso xadrez característico
- ✅ **PS1 lighting** - Iluminação simples de 3 pontos
- ✅ **Low-fi aesthetic** - Geometria simples, estética retro

## 10 Criaturas Implementadas

1. **Olgrim** - Olho flutuante com 6 tentáculos (purple)
2. **Terravox** - Golem de pedra robusto (brown/gray)
3. **Feralis** - Felino ágil com cauda longa (green)
4. **Brontis** - Réptil bípede com cauda (dark green)
5. **Zephyra** - Ave com asas e bico (sky blue)
6. **Ignar** - Fera de fogo com chifres (red-orange, glowing)
7. **Mirella** - Criatura anfíbia estilo sapo (light blue)
8. **Umbrix** - Besta sombria com tentáculos etéreos (dark purple/black)
9. **Sylphid** - Espírito etéreo com partículas (golden, translucent)
10. **Raukor** - Lobo lupino com cauda espessa (silver-gray)

## Usage Example

```typescript
// In main.ts
gameUI.onView3D = () => {
  inRanch3D = true;
  ranch3DUI = new Ranch3DUI(canvas, gameState.activeBeast);
  
  ranch3DUI.onExit3D = () => {
    inRanch3D = false;
    ranch3DUI?.dispose();
    ranch3DUI = null;
  };
};
```

## Credits

- **Inspiration**: Monster Rancher (PS1, Tecmo, 1997)
- **Engine**: Three.js
- **Style**: PS1-era 3D graphics
- **Implementation**: Guardian Grove (2025)

---

**Experience your beasts in glorious PS1-style 3D!** 🐉✨

