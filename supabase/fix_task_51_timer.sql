-- PASSO 1: Identificar o timer travado/esquecido
-- Este comando vai mostrar o registro culpado
SELECT 
  id, 
  user_id, 
  start_time, 
  end_time,
  NOW() - start_time as duration
FROM time_logs
WHERE task_id = (SELECT id FROM tasks WHERE task_number = 51)
  AND end_time IS NULL;

-- PASSO 2: Corrigir o problema
-- Opção A: CANCELAR o timer (definir duração como 0)
-- Use esta opção se o timer foi aberto por engano ou esquecido e não deve contar horas.
/*
UPDATE time_logs
SET end_time = start_time
WHERE task_id = (SELECT id FROM tasks WHERE task_number = 51)
  AND end_time IS NULL
  AND start_time < (NOW() - INTERVAL '24 hours');
*/

-- Opção B: ENCERRAR o timer com uma duração razoável (ex: 1 hora depois do início)
-- Use esta opção se houve trabalho mas o timer não foi parado.
/*
UPDATE time_logs
SET end_time = start_time + INTERVAL '1 hour'
WHERE task_id = (SELECT id FROM tasks WHERE task_number = 51)
  AND end_time IS NULL
  AND start_time < (NOW() - INTERVAL '24 hours');
*/

-- Opção C: EXCLUIR o registro travado
-- Use esta opção se quiser remover completamente o registro do histórico.
/*
DELETE FROM time_logs
WHERE task_id = (SELECT id FROM tasks WHERE task_number = 51)
  AND end_time IS NULL
  AND start_time < (NOW() - INTERVAL '24 hours');
*/
