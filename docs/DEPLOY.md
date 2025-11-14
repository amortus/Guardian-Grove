# 🚀 Deploy Guide - Guardian Grove

## 📍 URLs de Produção

- **Frontend:** https://guardian-grove.vercel.app
- **Backend:** https://guardian-grove-production.up.railway.app
- **GitHub:** https://github.com/amortus/Guardian-Grove

---

## 🌐 Deploy do Frontend (Vercel)

### 1. Garanta que o projeto Vercel aponta para ESTE repositório
1. Dashboard Vercel → `guardian-grove` → Settings → **Git**.
2. Se ainda estiver conectado ao repositório antigo (`vanilla-game` / Beast Keepers), clique em **Disconnect**.
3. Clique em **Connect a Git Repository** → selecione `amortus/Guardian-Grove`.
4. Configure:
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### 2. Variáveis de ambiente no Vercel
1. Settings → Environment Variables.
2. Defina (ou atualize):
   - `VITE_API_URL = https://guardian-grove-production.up.railway.app/api`
   - `NODE_ENV = production`
3. Clique em **Save** e depois em **Redeploy** (botão no topo).

### 3. Deploy automático
- Após a configuração acima, o fluxo é:
  1. `git push` na branch `master`.
  2. Vercel dispara o build (`npm install`, `npm run build`) dentro de `client/`.
  3. O domínio https://guardian-grove.vercel.app recebe a nova versão (~2-3 minutos).

#### Comandos úteis
```bash
git add .
git commit -m "sua mensagem"
git push
```

### 4. Verificar deploy
- Vercel Dashboard: https://vercel.com/dashboard (verifique build recente com status verde)
- Ou pela CI do GitHub (checks ✅ ao lado do commit)

---

## 🚂 Deploy do Backend (Railway)

### ⚠️ Deploy Manual Necessário

**Como fazer (2 minutos):**

1. Acesse: https://railway.app/dashboard
2. Encontre o projeto "Guardian Grove"
3. Clique no serviço (`guardian-grove-production`)
4. Opções:
   - Clique em **"Deploy"** ou **"Redeploy"**
   - OU clique nos **⋮** → **"Redeploy"**
   - OU vá em Settings → Deployments → **"Trigger Deploy"**
5. Aguarde 2-3 minutos
6. ✅ Pronto!

### Configurar Auto-Deploy (Recomendado):

1. No Railway Dashboard → Projeto → Serviço
2. Settings → Source
3. Connect to GitHub:
   - Repo: `amortus/Guardian-Grove`
   - Branch: `master`
   - Root Directory: `/server`
4. Enable: **"Auto Deploy on Push"**
5. Salvar

Depois disso, `git push` fará deploy automático!

---

## 🧪 Testar Deploy

Após fazer deploy de ambos:

```bash
# Testar Frontend
curl https://guardian-grove.vercel.app

# Testar Backend
curl https://guardian-grove-production.up.railway.app/api/health
```

Ou acesse no navegador e teste o jogo!

---

## 🔧 Troubleshooting

### Frontend não atualiza:
- Limpe cache: `Ctrl + Shift + R`
- Ou abra em anônimo: `Ctrl + Shift + N`
- Aguarde 5 minutos (cache da CDN)
- Confirme no dashboard do Vercel se o deployment mais recente está apontando para o commit correto
- Se ainda aparecer "Beast Keepers", o domínio está ligado a um projeto antigo — refaça o passo 1 acima e redeploy

### Backend com erro:
- Verifique logs no Railway Dashboard
- Verifique se banco de dados está online
- Verifique variáveis de ambiente

### Tela inicial ainda mostra dados antigos:
- Abra o jogo em aba anônima ou limpe o `localStorage`
- Remova as chaves `guardian_grove_version` e `guardian_grove_save` (DevTools → Application → Local Storage)
- Recarregue após confirmar que o backend está no banco novo

### Auto-fix do banco:
- O servidor roda `autoFixSchema()` na inicialização
- Cria coluna `current_action` automaticamente se não existir
- Veja logs no Railway para confirmar

---

## 📊 Checklist de Deploy

- [ ] Código commitado
- [ ] Push para GitHub
- [ ] Vercel deployed (automático)
- [ ] Railway deployed (manual ou auto)
- [ ] Frontend testado
- [ ] Backend testado
- [ ] Jogo funcionando em produção

**Tudo pronto quando todos os itens estiverem ✅**

