# Aplicar Índices de Busca no Supabase

## Opção 1: Via SQL Editor (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá para o projeto NowFlow
3. Clique em "SQL Editor" no menu lateral
4. Clique em "New Query"
5. Cole o conteúdo do arquivo `add_search_indexes.sql`
6. Clique em "Run" (ou pressione Cmd/Ctrl + Enter)

## Opção 2: Via Script TypeScript

Se você tiver a `SUPABASE_SERVICE_ROLE_KEY`:

1. Adicione a chave no arquivo `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
   ```

2. Execute o script:
   ```bash
   npx tsx apply_search_indexes.ts
   ```

## Verificar Índices Criados

Após aplicar, você pode verificar se os índices foram criados com esta query:

```sql
SELECT 
    indexname, 
    tablename,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
```

## Índices que serão criados:

- ✅ `idx_clients_name` - Busca rápida por nome de cliente
- ✅ `idx_projects_name` - Busca rápida por nome de projeto  
- ✅ `idx_projects_client_id` - Join otimizado projects → clients
- ✅ `idx_tasks_project_id` - Join otimizado tasks → projects
- ✅ `idx_tasks_client_id` - Join otimizado tasks → clients
- ✅ `idx_tasks_search` - Busca composta (title + task_number)

## Impacto Esperado:

- 🚀 Queries de busca 5-10x mais rápidas
- 📊 Joins otimizados entre tabelas
- ⚡ Melhor performance com crescimento de dados
