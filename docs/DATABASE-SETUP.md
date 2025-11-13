# 🗄️ Database Setup - Guardian Grove

## ✅ Status Atual

- **Banco de dados:** PostgreSQL no Railway (separado do Beast Keepers)
- **URL interna:** `postgresql://postgres:baBBeJvjWnKrwUCoZRCodaRfHloFDfpB@postgres.railway.internal:5432/railway`
- **Configuração:** Arquivos atualizados com a nova URL

---

## 📋 Próximos Passos

### 1. Atualizar Variável no Railway Backend

No Railway Dashboard:
1. Vá para o serviço **Node/Express do Guardian Grove**
2. Aba **Variables**
3. Atualize `DATABASE_URL` para:
   ```
   postgresql://postgres:baBBeJvjWnKrwUCoZRCodaRfHloFDfpB@postgres.railway.internal:5432/railway
   ```

### 2. Migrações automáticas em produção

- O comando de start do Railway agora executa `npm run migrate` ANTES de iniciar o servidor (`railway.json`).
- A tabela `migration_history` impede que o mesmo arquivo rode duas vezes.
- Resultado: toda vez que redeployar, o banco é ajustado automaticamente.

### 3. Atualizar .env Local (Opcional)

Se quiser rodar migrações localmente:
1. Pegue a URL pública do Railway (veja Opção C acima)
2. Edite `Guardian Grove/server/.env`:
   ```
   DATABASE_URL=postgresql://postgres:...@containers-us-west-xxx.railway.app:5432/railway
   ```
3. Rode: `npm run migrate --workspace=server`

---

## 🔒 Isolamento de Ambientes

✅ **Guardian Grove** usa banco separado  
✅ **Beast Keepers** continua usando seu banco original  
✅ **Sem compartilhamento de dados** entre projetos

---

## 📝 Notas

- A URL `postgres.railway.internal` só funciona dentro da rede Railway
- Para conexões externas, use a URL pública
- O backend no Railway usa a URL interna automaticamente
- Migrações podem ser rodadas no deploy ou manualmente via terminal

