# 🚀 Deploy Guide - Guardian Grove

## 📍 URLs de Produção

- **Frontend:** https://guardian-grove.vercel.app
- **Backend:** https://guardian-grove-production.up.railway.app
- **GitHub:** https://github.com/amortus/Guardian-Grove

---

## 🌐 Deploy do Frontend (Vercel)

### Auto-Deploy Configurado ✅

Guardian Grove está conectado ao Vercel:
1. `git push` para `master` no GitHub.
2. Vercel detecta o push.
3. Build automático e deploy em ~2-3 minutos.

**Comandos:**
```bash
git add .
git commit -m "sua mensagem"
git push
```

### Verificar Deploy:
- Dashboard: https://vercel.com/dashboard
- Ou veja o status no GitHub: marcas verdes ✅ ao lado do commit

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

### Backend com erro:
- Verifique logs no Railway Dashboard
- Verifique se banco de dados está online
- Verifique variáveis de ambiente

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

