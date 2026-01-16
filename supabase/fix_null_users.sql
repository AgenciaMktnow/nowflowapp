-- =========================================================================================
-- PADRONIZAÇÃO DE DADOS - CORREÇÃO DE ORGANIZATION_ID
-- =========================================================================================

-- 1. Atualização em Massa
-- Define a organização 'MKTNOW-Sede' para todos os usuários que estão com organization_id NULO.
-- AVISO: Isso afetará todos os usuários 'órfãos' do sistema.

UPDATE public.users
SET organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342'
WHERE organization_id IS NULL;


-- 2. Verificação Pós-Correção
-- Deve retornar 0 registros se a atualização funcionou.
SELECT count(*) as usuarios_sem_org 
FROM public.users 
WHERE organization_id IS NULL;


-- 3. Confirmação Visual
-- Lista os usuários atualizados (amostra) para confirmar se estão na org correta.
SELECT id, email, organization_id 
FROM public.users 
WHERE organization_id = 'fec68b03-39cc-4cfa-b4c0-c66cb7c37342'
LIMIT 10;
