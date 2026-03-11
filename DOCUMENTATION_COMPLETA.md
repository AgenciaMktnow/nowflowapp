# DOCUMENTAÇÃO COMPLETA, EXAUSTIVA E DETALHADA DO PROJETO

> Este documento descreve minuciosamente todos os arquivos do projeto (excluindo arquivos individuais dentro de node_modules e .git, que são resumidos via package.json), suas responsabilidades, conexões e fluxos, cobrindo frontend, backend, infra e banco de dados.

## 1. RESUMO EXECUTIVO TÉCNICO E ARQUITETURA GERAL

O sistema possui uma arquitetura baseada em **React** (via Vite) no Frontend e **Supabase** (PostgreSQL + Auth + Storage) como Backend/BaaS.
- **Padrões Utilizados:** O código adota padrões de Componentização Modular (React), Hooks Customizados para separação de lógica, Controle de Estado (provavelmente Zustand ou Context), além de utilitários isolados.
- **Fluxo de Aplicação:** A aplicação inicia no `src/main.tsx`, injeta o App principal (`src/App.tsx`), roteia as requisições (geralmente via react-router-dom) para os componentes em `src/pages`, consumindo dados no banco (Supabase) configurados na pasta `src/lib/supabase.ts`.
- **Infraestrutura e Dependências:** As dependências internas estão mapeadas no `package.json`, gerenciadas pelo npm/yarn/pnpm. O `vite.config.ts` e `tsconfig.json` definem o build e tipagem. O banco de dados evolui por meio dos arquivos `.sql` (migrations ou esquemas fixos) dentro de `supabase/` ou pasta raiz.

## 2. MAPA ESTRUTURAL (ÁRVORE DO PROJETO)

```
📁 raiz
  📄 .env
  📄 .gitignore
  📄 add_client_to_projects.sql
  📄 add_queue_position.sql
  📄 add_search_indexes.sql
  📄 add_task_estimation_category.sql
  📄 add_team_to_projects.sql
  📄 add_weekly_capacity_to_users.sql
  📄 APPLY_INDEXES.md
  📄 apply_migration_temp.ts
  📄 apply_rls_fix.ts
  📄 apply_search_indexes.ts
  📄 board_columns_schema.sql
  📄 check_avatar.ts
  📄 check_columns.ts
  📄 check_schema_projects.ts
  📄 check_user.ts
  📄 create_activity_table.sql
  📄 create_client_projects_table.sql
  📄 debug_check_connections.ts
  📄 debug_check_fks.ts
  📄 debug_check_schema_notif.ts
  📄 debug_check_task_10.ts
  📄 debug_check_task_10_v2.ts
  📄 debug_check_user_roles.ts
  📄 debug_dashboard_query.ts
  📄 debug_emergency_check.ts
  📄 debug_inspect_hierarchy_schema.ts
  📄 debug_inspect_teams.ts
  📄 debug_inspect_users_schema.ts
  📄 debug_last_logs.ts
  📄 debug_logs.ts
  📄 debug_plan.txt
  📄 debug_report_simulation.ts
  📄 debug_specific_task.ts
  📄 debug_validate_task10.ts
  📄 deploy_migrations.mjs
  📄 dropdown.patch
  📄 enable_time_logs_policy.sql
  📄 eslint.config.js
  📄 fix_dropdowns.py
  📄 force_admin.ts
  📄 generate_docs.cjs
  📄 index.html
  📄 mock_team_capacity_data.sql
  📄 mock_traceability_data.sql
  📄 package-lock.json
  📄 package.json
  📄 postcss.config.js
  📄 README.md
  📄 run_emergency_fix.ts
  📄 run_migration.ts
  📄 run_migration_rpc.mjs
  📄 run_queue_migration.ts
  📄 schema.sql
  📄 seed_kanban.ts
  📄 SUPABASE_SETUP.md
  📄 tailwind.config.js
  📄 temp_task_data.json
  📄 tsconfig.app.json
  📄 tsconfig.json
  📄 tsconfig.node.json
  📄 update_schema_team_reports.sql
  📄 vercel.json
  📄 verify_db.ts
  📄 vite.config.ts
  📄 WALKTHROUGH.md
📁 public
  📄 3_PNG_Isotipo_Fundo_Claro.png
  📄 4_Favicon.png
  📄 Logo-nowflow-banco.png
  📄 vite.svg
📁 src
  📄 App.css
  📄 App.tsx
  📄 index.css
  📄 main.tsx
📁 src\assets
  📄 react.svg
📁 src\components
  📄 ActivityFeed.tsx
  📄 AttachmentList.tsx
  📄 BroadcastReceiver.tsx
  📄 CloneTaskModal.tsx
  📄 ColumnMenu.tsx
  📄 DateRangePicker.tsx
  📄 ErrorBoundary.tsx
  📄 Layout.tsx
  📄 ModernDropdown.tsx
  📄 MultiBoardSelector.tsx
  📄 MultiSelectDropdown.tsx
  📄 NewColumnModal.tsx
  📄 NewProjectModal.tsx
  📄 NewWorkflowModal.tsx
  📄 ProductivityWidget.tsx
  📄 SelectDropdown.tsx
  📄 Sidebar.tsx
  📄 SimpleEditor.tsx
  📄 TaskActionMenu.tsx
  📄 TaskActivityLog.tsx
  📄 TaskCard.tsx
  📄 TaskEditDrawer.tsx
  📄 WorkloadBoard.tsx
  📄 WorkloadColumn.tsx
  📄 WorkloadTaskCard.tsx
📁 src\components\admin
  📄 BroadcastModal.tsx
  📄 CostTooltip.tsx
  📄 FeatureUsageChart.tsx
  📄 OrgDetailsModal.tsx
  📄 QuotaProgressBar.tsx
  📄 RevenueGrowthChart.tsx
  📄 UserGrowthChart.tsx
📁 src\components\common
  📄 Dropdown.tsx
  📄 UserAvatar.tsx
📁 src\components\editor\extensions
  📄 FontSize.ts
  📄 ResizableImageComponent.tsx
  📄 ResizableImageExtension.ts
📁 src\components\landing\mockups
  📄 MockupDashboard.tsx
  📄 MockupKanban.tsx
  📄 MockupTaskChat.tsx
  📄 MockupTimer.tsx
📁 src\components\layout\Header
  📄 Header.tsx
  📄 NotificationDropdown.tsx
  📄 SearchBar.tsx
  📄 UserActions.tsx
📁 src\components\mention
  📄 MentionList.tsx
  📄 suggestion.ts
📁 src\components\modals
  📄 AutoPauseAlert.tsx
  📄 UserDeleteModal.tsx
📁 src\components\time-tracking
  📄 CategoryBottleneckChart.tsx
  📄 DailyTimeline.tsx
  📄 LiveTimerWidget.tsx
  📄 PerformancePanel.tsx
  📄 TeamReport.tsx
  📄 WeeklyTimesheet.tsx
  📄 WorkHeatmap.tsx
📁 src\components\ui
  📄 ToastProvider.tsx
📁 src\constants
  📄 plans.ts
📁 src\contexts
  📄 AuthContext.tsx
  📄 SettingsContext.tsx
📁 src\hooks
  📄 useClickOutside.ts
  📄 useKeyboardShortcut.ts
  📄 useNotifications.tsx
  📄 usePermissions.ts
  📄 useTaskActions.ts
📁 src\lib
  📄 supabase.ts
  📄 utils.ts
📁 src\pages
  📄 About.tsx
  📄 AuthCallback.tsx
  📄 ClientManagement.tsx
  📄 Contact.tsx
  📄 CreateProject.tsx
  📄 CreateTask.tsx
  📄 Dashboard.tsx
  📄 Help.tsx
  📄 LandingPage.tsx
  📄 Legal.tsx
  📄 Login.tsx
  📄 MyQueue.tsx
  📄 MyQueue.tsx.bak
  📄 MyQueue.tsx.bak2
  📄 NewTask.tsx
  📄 NotFound.tsx
  📄 Profile.tsx
  📄 Projects.tsx
  📄 ResetPassword.tsx
  📄 Roadmap.tsx
  📄 Security.tsx
  📄 Settings.tsx
  📄 SetupPassword.tsx
  📄 SignUp.tsx
  📄 TaskCalendar.tsx
  📄 TaskDetail.tsx
  📄 TeamManagement.tsx
  📄 TimeTracking.tsx
📁 src\pages\admin
  📄 SaasDashboard.tsx
📁 src\pages\settings
  📄 BoardsSettings.tsx
  📄 CategoriesSettings.tsx
  📄 GeneralSettings.tsx
  📄 IntegrationsSettings.tsx
  📄 NotificationsSettings.tsx
  📄 ProjectSettings.tsx
  📄 TeamsSettings.tsx
  📄 WorkflowsSettings.tsx
📁 src\services
  📄 activityLogger.ts
  📄 admin.service.ts
  📄 auth.service.test.ts
  📄 auth.service.ts
  📄 board.service.ts
  📄 client.service.ts
  📄 notification.service.ts
  📄 portfolio.service.ts
  📄 project.service.ts
  📄 report.service.ts
  📄 settings.service.ts
  📄 task.service.ts
  📄 team.service.ts
  📄 workflow.service.ts
📁 src\types
  📄 auth.ts
  📄 database.types.ts
📁 src\utils
  📄 checklist.ts
  📄 imageCompression.ts
📁 supabase
  📄 audit_query.sql
  📄 emergency_disable_rls.sql
  📄 emergency_fix_negative_time.sql
  📄 fix_massive_outliers.sql
  📄 fix_null_users.sql
  📄 fix_task_51_timer.sql
  📄 investigate_outliers.sql
📁 supabase\.temp
  📄 cli-latest
📁 supabase\functions\check-deadlines
  📄 index.ts
📁 supabase\functions\send-notification
  📄 index.ts
📁 supabase\migrations
  📄 20251229_add_description_to_time_logs.sql
  📄 20251229_dynamic_kanban.sql
  📄 20251229_optimize_kanban.sql
  📄 20251230_add_client_default_board.sql
  📄 20251230_add_client_structure.sql
  📄 20251230_add_favicon_url.sql
  📄 20251230_add_theme_preference.sql
  📄 20251230_create_system_settings.sql
  📄 20251230_emergency_fix.sql
  📄 20251230_link_tasks_to_board_columns.sql
  📄 20251230_link_workflows_to_boards.sql
  📄 20251230_migrate_columns_to_boards.sql
  📄 20251230_sync_user_teams.sql
  📄 20251231_create_storage_bucket.sql
  📄 20251231_expose_settings_public.sql
  📄 20251231_handle_new_user_trigger.sql
  📄 20260105_add_client_default_team.sql
  📄 20260105_auto_sync_auth_users.sql
  📄 20260105_create_notification_preferences.sql
  📄 20260105_create_task_boards.sql
  📄 20260105_ensure_user_profile_rpc.sql
  📄 20260105_fix_clients_rls.sql
  📄 20260105_fix_project_client_ids.sql
  📄 20260105_fix_queue_access_additive.sql
  📄 20260105_fix_users_rls_complete.sql
  📄 20260105_fix_users_rls_policy.sql
  📄 20260105_project_hierarchy_integrity.sql
  📄 20260105_update_triggers_for_email.sql
  📄 20260106_add_task_position_column.sql
  📄 20260106_fix_admin_permissions_and_delete_user.sql
  📄 20260106_fix_delete_user_rpc_v3_column_name.sql
  📄 20260106_fix_tasks_rls_for_admins.sql
  📄 20260106_update_delete_user_rpc_v2.sql
  📄 20260107165500_shield_protocol.sql
  📄 20260107170500_shield_patch_autofill.sql
  📄 20260107171000_shield_fix_v2.sql
  📄 20260107171500_shield_fix_v3_missing_policies.sql
  📄 20260107174000_ghost_user_diagnosis.sql
  📄 20260107174500_ghost_user_cleanup.sql
  📄 20260107180000_sync_last_seen.sql
  📄 20260107190000_notifications_core.sql
  📄 20260107210000_fix_user_creation.sql
  📄 20260107223000_notifications_extended.sql
  📄 20260107224500_fix_notification_status_names.sql
  📄 20260107225500_add_mentions_column.sql
  📄 20260107230000_refine_notification_content.sql
  📄 20260107231500_fix_notification_titles.sql
  📄 20260107233000_fix_comment_notifications.sql
  📄 20260108_activity_log.sql
  📄 20260108_allow_manager_delete_tasks.sql
  📄 20260108_audit_time_tracking.sql
  📄 20260108_cleanup_legacy_roles.sql
  📄 20260108_collaborative_flow.sql
  📄 20260108_create_task_attachments.sql
  📄 20260108_create_task_attachments_v2.sql
  📄 20260108_emergency_fix_constraints.sql
  📄 20260108_fix_activity_log_schema.sql
  📄 20260108_fix_delete_bug_final.sql
  📄 20260108_fix_delete_final_v2.sql
  📄 20260108_fix_delete_user_transfer.sql
  📄 20260108_fix_legacy_columns.sql
  📄 20260108_fix_notification_html_sanitization.sql
  📄 20260108_fix_null_interceptor.sql
  📄 20260108_fix_trigger_logic_v3.sql
  📄 20260108_prevent_role_escalation.sql
  📄 20260108_refine_notifications_v3.sql
  📄 20260108_rename_operator_to_member.sql
  📄 20260108_rename_operator_to_member_fix.sql
  📄 20260108_rename_operator_to_member_fix_v2.sql
  📄 20260108_security_hardness.sql
  📄 20260109_auto_calculate_duration.sql
  📄 20260109_enforce_one_active_timer.sql
  📄 20260109_fix_storage_permissions.sql
  📄 20260109_restrict_settings_access.sql
  📄 20260109_user_onboarding_flow.sql
  📄 20260112_add_billing_schema.sql
  📄 20260112_add_is_continuous_to_tasks.sql
  📄 20260112_add_limits_to_rpc.sql
  📄 20260112_atomic_timer.sql
  📄 20260112_auto_pause_cron.sql
  📄 20260112_auto_pause_settings.sql
  📄 20260112_broadcast_system.sql
  📄 20260112_calendar_workload.sql
  📄 20260112_create_saas_dashboard.sql
  📄 20260112_enable_public_signup.sql
  📄 20260112_enforce_quotas.sql
  📄 20260112_feature_usage_stats.sql
  📄 20260112_fix_board_defaults.sql
  📄 20260112_get_system_stats.sql
  📄 20260112_god_mode_rls.sql
  📄 20260112_saas_details.sql
  📄 20260112_saas_metrics_history.sql
  📄 20260113_add_super_admin_flag.sql
  📄 20260113_advanced_admin_management.sql
  📄 20260113_fix_org_access_and_quotas.sql
  📄 20260113_org_deletion_cascade.sql
  📄 20260113_security_p0_unification.sql
  📄 20260114_fix_users_rls.sql
  📄 20260114_time_tracking_net_balance.sql
  📄 20260116_simplify_rls_final.sql
  📄 20260123_jwt_sync_optimization.sql
  📄 20260123_nuclear_policy_reset.sql
  📄 20260123_nuclear_policy_reset_v2.sql
  📄 20260123_rls_fix_part2_gap_filling.sql
  📄 20260123_rls_fix_part3_final_sweep.sql
  📄 20260123_urgent_rls_fix.sql
  📄 20260226_update_super_admin_mauricio.sql
  📄 add_entry_category_to_time_logs.sql
  📄 audit_mktnow_users.sql
  📄 check_org_columns.sql
  📄 check_passo_leftovers.sql
  📄 check_policies_and_users.sql
  📄 check_policies_and_users_v2.sql
  📄 create_boards_structure.sql
  📄 create_notifications_system.sql
  📄 create_task_assignees.sql
  📄 debug_tasks_rls.sql
  📄 debug_task_61.sql
  📄 delete_renan_check_others.sql
  📄 diagnostic_leak_investigation.sql
  📄 diagnostic_leak_investigation_v2.sql
  📄 diagnostic_rls.sql
  📄 emergency_fix_user_creation.sql
  📄 emergency_lockdown.sql
  📄 ensure_task_attachments_bucket.sql
  📄 final_diagnostic.sql
  📄 find_migrated_intruders.sql
  📄 fix_task_boards_relationship.sql
  📄 forensic_ghost_users.sql
  📄 manual_delete_org_omnitrion.sql
  📄 manual_delete_org_passo.sql
  📄 manual_fix_full_system.sql
  📄 manual_fix_merge_projects.sql
  📄 manual_fix_merge_projects_v2.sql
  📄 manual_fix_migrate_legacy_clients.sql
  📄 restore_system_access.sql
  📄 reveal_intruders.sql
  📄 user_teams.sql
```

## 3. DOCUMENTAÇÃO DOS ARQUIVOS (ARQUIVO POR ARQUIVO)

### 1. Arquivo: `.env`

- **Caminho Completo:** `.env`
- **Tipo:** Arquivo sem extensão
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 2. Arquivo: `.gitignore`

- **Caminho Completo:** `.gitignore`
- **Tipo:** Arquivo sem extensão
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 3. Arquivo: `add_client_to_projects.sql`

- **Caminho Completo:** `add_client_to_projects.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 4. Arquivo: `add_queue_position.sql`

- **Caminho Completo:** `add_queue_position.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 5. Arquivo: `add_search_indexes.sql`

- **Caminho Completo:** `add_search_indexes.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 6. Arquivo: `add_task_estimation_category.sql`

- **Caminho Completo:** `add_task_estimation_category.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 7. Arquivo: `add_team_to_projects.sql`

- **Caminho Completo:** `add_team_to_projects.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 8. Arquivo: `add_weekly_capacity_to_users.sql`

- **Caminho Completo:** `add_weekly_capacity_to_users.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 9. Arquivo: `APPLY_INDEXES.md`

- **Caminho Completo:** `APPLY_INDEXES.md`
- **Tipo:** .md
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de documentação existente.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 10. Arquivo: `apply_migration_temp.ts`

- **Caminho Completo:** `apply_migration_temp.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 11. Arquivo: `apply_rls_fix.ts`

- **Caminho Completo:** `apply_rls_fix.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path, dotenv, url
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 12. Arquivo: `apply_search_indexes.ts`

- **Caminho Completo:** `apply_search_indexes.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv, fs, path
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 13. Arquivo: `board_columns_schema.sql`

- **Caminho Completo:** `board_columns_schema.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: board_columns
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 14. Arquivo: `check_avatar.ts`

- **Caminho Completo:** `check_avatar.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 15. Arquivo: `check_columns.ts`

- **Caminho Completo:** `check_columns.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 16. Arquivo: `check_schema_projects.ts`

- **Caminho Completo:** `check_schema_projects.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 17. Arquivo: `check_user.ts`

- **Caminho Completo:** `check_user.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 18. Arquivo: `create_activity_table.sql`

- **Caminho Completo:** `create_activity_table.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: task_activities
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 19. Arquivo: `create_client_projects_table.sql`

- **Caminho Completo:** `create_client_projects_table.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 20. Arquivo: `debug_check_connections.ts`

- **Caminho Completo:** `debug_check_connections.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 21. Arquivo: `debug_check_fks.ts`

- **Caminho Completo:** `debug_check_fks.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 22. Arquivo: `debug_check_schema_notif.ts`

- **Caminho Completo:** `debug_check_schema_notif.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 23. Arquivo: `debug_check_task_10.ts`

- **Caminho Completo:** `debug_check_task_10.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** ./src/lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 24. Arquivo: `debug_check_task_10_v2.ts`

- **Caminho Completo:** `debug_check_task_10_v2.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 25. Arquivo: `debug_check_user_roles.ts`

- **Caminho Completo:** `debug_check_user_roles.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv, fs
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 26. Arquivo: `debug_dashboard_query.ts`

- **Caminho Completo:** `debug_dashboard_query.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 27. Arquivo: `debug_emergency_check.ts`

- **Caminho Completo:** `debug_emergency_check.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv, url, path
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 28. Arquivo: `debug_inspect_hierarchy_schema.ts`

- **Caminho Completo:** `debug_inspect_hierarchy_schema.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 29. Arquivo: `debug_inspect_teams.ts`

- **Caminho Completo:** `debug_inspect_teams.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 30. Arquivo: `debug_inspect_users_schema.ts`

- **Caminho Completo:** `debug_inspect_users_schema.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 31. Arquivo: `debug_last_logs.ts`

- **Caminho Completo:** `debug_last_logs.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 32. Arquivo: `debug_logs.ts`

- **Caminho Completo:** `debug_logs.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 33. Arquivo: `debug_plan.txt`

- **Caminho Completo:** `debug_plan.txt`
- **Tipo:** .txt
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 34. Arquivo: `debug_report_simulation.ts`

- **Caminho Completo:** `debug_report_simulation.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 35. Arquivo: `debug_specific_task.ts`

- **Caminho Completo:** `debug_specific_task.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 36. Arquivo: `debug_validate_task10.ts`

- **Caminho Completo:** `debug_validate_task10.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 37. Arquivo: `deploy_migrations.mjs`

- **Caminho Completo:** `deploy_migrations.mjs`
- **Tipo:** .mjs
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 38. Arquivo: `dropdown.patch`

- **Caminho Completo:** `dropdown.patch`
- **Tipo:** .patch
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 39. Arquivo: `enable_time_logs_policy.sql`

- **Caminho Completo:** `enable_time_logs_policy.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 40. Arquivo: `eslint.config.js`

- **Caminho Completo:** `eslint.config.js`
- **Tipo:** .js
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (6 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** defineConfig
- **Importa:** @eslint/js, globals, eslint-plugin-react-hooks, eslint-plugin-react-refresh, typescript-eslint, eslint/config
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 41. Arquivo: `fix_dropdowns.py`

- **Caminho Completo:** `fix_dropdowns.py`
- **Tipo:** .py
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 42. Arquivo: `force_admin.ts`

- **Caminho Completo:** `force_admin.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 43. Arquivo: `generate_docs.cjs`

- **Caminho Completo:** `generate_docs.cjs`
- **Tipo:** .cjs
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 44. Arquivo: `index.html`

- **Caminho Completo:** `index.html`
- **Tipo:** .html
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 45. Arquivo: `mock_team_capacity_data.sql`

- **Caminho Completo:** `mock_team_capacity_data.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 46. Arquivo: `mock_traceability_data.sql`

- **Caminho Completo:** `mock_traceability_data.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 47. Arquivo: `package-lock.json`

- **Caminho Completo:** `package-lock.json`
- **Tipo:** .json
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 48. Arquivo: `package.json`

- **Caminho Completo:** `package.json`
- **Tipo:** .json
- **Classificação:** Essencial
- **Responsabilidade Principal:** Manifesto do projeto (dependências internas, scripts de execução, informações do pacote).
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 49. Arquivo: `postcss.config.js`

- **Caminho Completo:** `postcss.config.js`
- **Tipo:** .js
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** default
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 50. Arquivo: `3_PNG_Isotipo_Fundo_Claro.png`

- **Caminho Completo:** `public\3_PNG_Isotipo_Fundo_Claro.png`
- **Tipo:** .png
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 51. Arquivo: `4_Favicon.png`

- **Caminho Completo:** `public\4_Favicon.png`
- **Tipo:** .png
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 52. Arquivo: `Logo-nowflow-banco.png`

- **Caminho Completo:** `public\Logo-nowflow-banco.png`
- **Tipo:** .png
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 53. Arquivo: `vite.svg`

- **Caminho Completo:** `public\vite.svg`
- **Tipo:** .svg
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 54. Arquivo: `README.md`

- **Caminho Completo:** `README.md`
- **Tipo:** .md
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de documentação existente.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 55. Arquivo: `run_emergency_fix.ts`

- **Caminho Completo:** `run_emergency_fix.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 56. Arquivo: `run_migration.ts`

- **Caminho Completo:** `run_migration.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 57. Arquivo: `run_migration_rpc.mjs`

- **Caminho Completo:** `run_migration_rpc.mjs`
- **Tipo:** .mjs
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 58. Arquivo: `run_queue_migration.ts`

- **Caminho Completo:** `run_queue_migration.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 59. Arquivo: `schema.sql`

- **Caminho Completo:** `schema.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: users, Table: clients, Table: projects, Table: tasks, Table: time_logs, Table: approval_requests, Table: task_comments
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 60. Arquivo: `seed_kanban.ts`

- **Caminho Completo:** `seed_kanban.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, fs, path, url
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 61. Arquivo: `App.css`

- **Caminho Completo:** `src\App.css`
- **Tipo:** .css
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 62. Arquivo: `App.tsx`

- **Caminho Completo:** `src\App.tsx`
- **Tipo:** .tsx
- **Classificação:** Essencial
- **Responsabilidade Principal:** Entry point da aplicação frontend. Configura Providers, rotas base e renderiza o React na DOM.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (31 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** App
- **Importa:** react, react-router-dom, ./contexts/AuthContext, ./components/ErrorBoundary, ./pages/LandingPage, ./components/Layout, ./pages/Login, ./pages/SignUp, ./pages/ResetPassword, ./pages/SetupPassword, ./pages/AuthCallback, ./pages/Dashboard, ./pages/Projects, ./pages/CreateProject, ./pages/admin/SaasDashboard, ./pages/TimeTracking, ./pages/Roadmap, ./pages/Contact, ./pages/Legal, ./pages/About, ./pages/Security, ./pages/Help, ./pages/NewTask, ./pages/TaskDetail, ./pages/Settings, ./pages/Profile, ./pages/NotFound, ./pages/MyQueue, ./pages/TaskCalendar, ./components/ui/ToastProvider, ./contexts/SettingsContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 63. Arquivo: `react.svg`

- **Caminho Completo:** `src\assets\react.svg`
- **Tipo:** .svg
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 64. Arquivo: `ActivityFeed.tsx`

- **Caminho Completo:** `src\components\ActivityFeed.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, ./common/UserAvatar
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 65. Arquivo: `BroadcastModal.tsx`

- **Caminho Completo:** `src\components\admin\BroadcastModal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../services/admin.service, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 66. Arquivo: `CostTooltip.tsx`

- **Caminho Completo:** `src\components\admin\CostTooltip.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-dom
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 67. Arquivo: `FeatureUsageChart.tsx`

- **Caminho Completo:** `src\components\admin\FeatureUsageChart.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** recharts
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 68. Arquivo: `OrgDetailsModal.tsx`

- **Caminho Completo:** `src\components\admin\OrgDetailsModal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../services/admin.service, sonner, ../ModernDropdown, ./QuotaProgressBar
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 69. Arquivo: `QuotaProgressBar.tsx`

- **Caminho Completo:** `src\components\admin\QuotaProgressBar.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** QuotaProgressBar
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 70. Arquivo: `RevenueGrowthChart.tsx`

- **Caminho Completo:** `src\components\admin\RevenueGrowthChart.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** recharts
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 71. Arquivo: `UserGrowthChart.tsx`

- **Caminho Completo:** `src\components\admin\UserGrowthChart.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** recharts
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 72. Arquivo: `AttachmentList.tsx`

- **Caminho Completo:** `src\components\AttachmentList.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Attachment, function
- **Importa:** react, ../lib/supabase, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 73. Arquivo: `BroadcastReceiver.tsx`

- **Caminho Completo:** `src\components\BroadcastReceiver.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 74. Arquivo: `CloneTaskModal.tsx`

- **Caminho Completo:** `src\components\CloneTaskModal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, sonner, ../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 75. Arquivo: `ColumnMenu.tsx`

- **Caminho Completo:** `src\components\ColumnMenu.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, sonner, ../services/board.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 76. Arquivo: `Dropdown.tsx`

- **Caminho Completo:** `src\components\common\Dropdown.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** DropdownOption, function
- **Importa:** react, ../../hooks/useClickOutside
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 77. Arquivo: `UserAvatar.tsx`

- **Caminho Completo:** `src\components\common\UserAvatar.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** memo
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 78. Arquivo: `DateRangePicker.tsx`

- **Caminho Completo:** `src\components\DateRangePicker.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 79. Arquivo: `FontSize.ts`

- **Caminho Completo:** `src\components\editor\extensions\FontSize.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** FontSize
- **Importa:** @tiptap/core
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 80. Arquivo: `ResizableImageComponent.tsx`

- **Caminho Completo:** `src\components\editor\extensions\ResizableImageComponent.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** ResizableImageComponent
- **Importa:** @tiptap/react, react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 81. Arquivo: `ResizableImageExtension.ts`

- **Caminho Completo:** `src\components\editor\extensions\ResizableImageExtension.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** ResizableImageExtension
- **Importa:** @tiptap/react, @tiptap/extension-image, ./ResizableImageComponent
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 82. Arquivo: `ErrorBoundary.tsx`

- **Caminho Completo:** `src\components\ErrorBoundary.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** ErrorBoundary
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 83. Arquivo: `MockupDashboard.tsx`

- **Caminho Completo:** `src\components\landing\mockups\MockupDashboard.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** MockupDashboard
- **Importa:** lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 84. Arquivo: `MockupKanban.tsx`

- **Caminho Completo:** `src\components\landing\mockups\MockupKanban.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** MockupKanban
- **Importa:** lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 85. Arquivo: `MockupTaskChat.tsx`

- **Caminho Completo:** `src\components\landing\mockups\MockupTaskChat.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** MockupTaskChat
- **Importa:** react, lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 86. Arquivo: `MockupTimer.tsx`

- **Caminho Completo:** `src\components\landing\mockups\MockupTimer.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** MockupTimer
- **Importa:** react, lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 87. Arquivo: `Header.tsx`

- **Caminho Completo:** `src\components\layout\Header\Header.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** ./SearchBar, ./UserActions
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 88. Arquivo: `NotificationDropdown.tsx`

- **Caminho Completo:** `src\components\layout\Header\NotificationDropdown.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react-router-dom, ../../../services/notification.service, date-fns, date-fns/locale
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 89. Arquivo: `SearchBar.tsx`

- **Caminho Completo:** `src\components\layout\Header\SearchBar.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (6 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../../lib/supabase, react-router-dom, ../../../hooks/useClickOutside, ../../../hooks/useKeyboardShortcut, fuse.js
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 90. Arquivo: `UserActions.tsx`

- **Caminho Completo:** `src\components\layout\Header\UserActions.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** ../../../contexts/AuthContext, react-router-dom, react, ../../../hooks/useNotifications, ./NotificationDropdown
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 91. Arquivo: `Layout.tsx`

- **Caminho Completo:** `src\components\Layout.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (7 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, ./Sidebar, ../contexts/SettingsContext, ../contexts/AuthContext, ./modals/AutoPauseAlert, ./BroadcastReceiver
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 92. Arquivo: `MentionList.tsx`

- **Caminho Completo:** `src\components\mention\MentionList.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** forwardRef
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 93. Arquivo: `suggestion.ts`

- **Caminho Completo:** `src\components\mention\suggestion.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** default
- **Importa:** @tiptap/react, tippy.js, ./MentionList, ../../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 94. Arquivo: `AutoPauseAlert.tsx`

- **Caminho Completo:** `src\components\modals\AutoPauseAlert.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, ../../lib/supabase, ../../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 95. Arquivo: `UserDeleteModal.tsx`

- **Caminho Completo:** `src\components\modals\UserDeleteModal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, ../SelectDropdown
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 96. Arquivo: `ModernDropdown.tsx`

- **Caminho Completo:** `src\components\ModernDropdown.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** DropdownOption, function
- **Importa:** react, react-dom
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 97. Arquivo: `MultiBoardSelector.tsx`

- **Caminho Completo:** `src\components\MultiBoardSelector.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** MultiBoardSelector
- **Importa:** react, react-dom, ../types/database.types
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 98. Arquivo: `MultiSelectDropdown.tsx`

- **Caminho Completo:** `src\components\MultiSelectDropdown.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** DropdownOption, function
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 99. Arquivo: `NewColumnModal.tsx`

- **Caminho Completo:** `src\components\NewColumnModal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 100. Arquivo: `NewProjectModal.tsx`

- **Caminho Completo:** `src\components\NewProjectModal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (6 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, sonner, ../services/project.service, ../services/team.service, ../services/board.service, ./ModernDropdown
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 101. Arquivo: `NewWorkflowModal.tsx`

- **Caminho Completo:** `src\components\NewWorkflowModal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** WorkflowStep, function
- **Importa:** react, ./ModernDropdown
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 102. Arquivo: `ProductivityWidget.tsx`

- **Caminho Completo:** `src\components\ProductivityWidget.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** ProductivityWidget
- **Importa:** react, ../lib/supabase, ../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 103. Arquivo: `SelectDropdown.tsx`

- **Caminho Completo:** `src\components\SelectDropdown.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-dom
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 104. Arquivo: `Sidebar.tsx`

- **Caminho Completo:** `src\components\Sidebar.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, ../contexts/SettingsContext, ../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 105. Arquivo: `SimpleEditor.tsx`

- **Caminho Completo:** `src\components\SimpleEditor.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (18 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** SimpleEditor
- **Importa:** @tiptap/react, @tiptap/starter-kit, ./editor/extensions/ResizableImageExtension, @tiptap/extension-underline, @tiptap/extension-placeholder, @tiptap/extension-task-list, @tiptap/extension-task-item, @tiptap/extension-link, @tiptap/extension-text-align, @tiptap/extension-text-style, @tiptap/extension-color, @tiptap/extension-code-block, @tiptap/extension-font-family, ./editor/extensions/FontSize, react, sonner, @tiptap/extension-mention, ./mention/suggestion
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 106. Arquivo: `TaskActionMenu.tsx`

- **Caminho Completo:** `src\components\TaskActionMenu.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-dom, ../hooks/useTaskActions, ../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 107. Arquivo: `TaskActivityLog.tsx`

- **Caminho Completo:** `src\components\TaskActivityLog.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** TaskActivityLog
- **Importa:** react, ./common/UserAvatar, ../lib/supabase, date-fns, date-fns/locale
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 108. Arquivo: `TaskCard.tsx`

- **Caminho Completo:** `src\components\TaskCard.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (6 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** memo
- **Importa:** @hello-pangea/dnd, react, ./TaskActionMenu, ../utils/checklist, react-router-dom, ./common/UserAvatar
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 109. Arquivo: `TaskEditDrawer.tsx`

- **Caminho Completo:** `src\components\TaskEditDrawer.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-dom, ../pages/NewTask
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 110. Arquivo: `CategoryBottleneckChart.tsx`

- **Caminho Completo:** `src\components\time-tracking\CategoryBottleneckChart.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** ../../services/report.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 111. Arquivo: `DailyTimeline.tsx`

- **Caminho Completo:** `src\components\time-tracking\DailyTimeline.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, ../../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 112. Arquivo: `LiveTimerWidget.tsx`

- **Caminho Completo:** `src\components\time-tracking\LiveTimerWidget.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, ../../contexts/AuthContext, react-router-dom
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 113. Arquivo: `PerformancePanel.tsx`

- **Caminho Completo:** `src\components\time-tracking\PerformancePanel.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, ../../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 114. Arquivo: `TeamReport.tsx`

- **Caminho Completo:** `src\components\time-tracking\TeamReport.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (12 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, ../../services/report.service, ./WorkHeatmap, ./CategoryBottleneckChart, ../ModernDropdown, ../DateRangePicker, react-router-dom, jspdf, jspdf-autotable, sonner, ../../hooks/usePermissions
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 115. Arquivo: `WeeklyTimesheet.tsx`

- **Caminho Completo:** `src\components\time-tracking\WeeklyTimesheet.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, ../../contexts/AuthContext, react-router-dom, ../DateRangePicker
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 116. Arquivo: `WorkHeatmap.tsx`

- **Caminho Completo:** `src\components\time-tracking\WorkHeatmap.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../services/report.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 117. Arquivo: `ToastProvider.tsx`

- **Caminho Completo:** `src\components\ui\ToastProvider.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** ToastProvider
- **Importa:** sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 118. Arquivo: `WorkloadBoard.tsx`

- **Caminho Completo:** `src\components\WorkloadBoard.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, @hello-pangea/dnd, ../lib/supabase, ./WorkloadColumn, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 119. Arquivo: `WorkloadColumn.tsx`

- **Caminho Completo:** `src\components\WorkloadColumn.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** memo
- **Importa:** react, @hello-pangea/dnd, ./WorkloadTaskCard, ./common/UserAvatar
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 120. Arquivo: `WorkloadTaskCard.tsx`

- **Caminho Completo:** `src\components\WorkloadTaskCard.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** memo
- **Importa:** @hello-pangea/dnd, react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 121. Arquivo: `plans.ts`

- **Caminho Completo:** `src\constants\plans.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** PLANS, PlanType, FeatureKey
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 122. Arquivo: `AuthContext.tsx`

- **Caminho Completo:** `src\contexts\AuthContext.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (6 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** AuthProvider, useAuth
- **Importa:** react, react-router-dom, @supabase/supabase-js, ../services/auth.service, sonner, ../types/auth
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 123. Arquivo: `SettingsContext.tsx`

- **Caminho Completo:** `src\contexts\SettingsContext.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** SettingsProvider, useSettings
- **Importa:** react, ../services/settings.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 124. Arquivo: `useClickOutside.ts`

- **Caminho Completo:** `src\hooks\useClickOutside.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Hooks customizados React. Extrai lógica reutilizável de componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** useClickOutside
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 125. Arquivo: `useKeyboardShortcut.ts`

- **Caminho Completo:** `src\hooks\useKeyboardShortcut.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Hooks customizados React. Extrai lógica reutilizável de componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** useKeyboardShortcut
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 126. Arquivo: `useNotifications.tsx`

- **Caminho Completo:** `src\hooks\useNotifications.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Hooks customizados React. Extrai lógica reutilizável de componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** useNotifications
- **Importa:** react, ../lib/supabase, ../contexts/AuthContext, ../services/notification.service, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 127. Arquivo: `usePermissions.ts`

- **Caminho Completo:** `src\hooks\usePermissions.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Hooks customizados React. Extrai lógica reutilizável de componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** usePermissions
- **Importa:** ../contexts/AuthContext, ../types/auth, ../constants/plans
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 128. Arquivo: `useTaskActions.ts`

- **Caminho Completo:** `src\hooks\useTaskActions.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Hooks customizados React. Extrai lógica reutilizável de componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** useTaskActions
- **Importa:** react, ../lib/supabase, sonner, ../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 129. Arquivo: `index.css`

- **Caminho Completo:** `src\index.css`
- **Tipo:** .css
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 130. Arquivo: `supabase.ts`

- **Caminho Completo:** `src\lib\supabase.ts`
- **Tipo:** .ts
- **Classificação:** Essencial
- **Responsabilidade Principal:** Utilitários genéricos e instâncias de bibliotecas (ex: Supabase client, classes utilitárias).
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** supabase
- **Importa:** @supabase/supabase-js
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 131. Arquivo: `utils.ts`

- **Caminho Completo:** `src\lib\utils.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Utilitários genéricos e instâncias de bibliotecas (ex: Supabase client, classes utilitárias).
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** cn
- **Importa:** clsx, tailwind-merge
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 132. Arquivo: `main.tsx`

- **Caminho Completo:** `src\main.tsx`
- **Tipo:** .tsx
- **Classificação:** Essencial
- **Responsabilidade Principal:** Entry point da aplicação frontend. Configura Providers, rotas base e renderiza o React na DOM.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** react-dom/client, ./App.tsx
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 133. Arquivo: `About.tsx`

- **Caminho Completo:** `src\pages\About.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, framer-motion, lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 134. Arquivo: `SaasDashboard.tsx`

- **Caminho Completo:** `src\pages\admin\SaasDashboard.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (11 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../services/admin.service, ../../components/admin/OrgDetailsModal, ../../components/admin/QuotaProgressBar, ../../components/admin/CostTooltip, ../../components/layout/Header/Header, sonner, ../../components/admin/RevenueGrowthChart, ../../components/admin/UserGrowthChart, ../../components/admin/FeatureUsageChart, ../../components/admin/BroadcastModal
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 135. Arquivo: `AuthCallback.tsx`

- **Caminho Completo:** `src\pages\AuthCallback.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, sonner, ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 136. Arquivo: `ClientManagement.tsx`

- **Caminho Completo:** `src\pages\ClientManagement.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, sonner, ../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 137. Arquivo: `Contact.tsx`

- **Caminho Completo:** `src\pages\Contact.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, framer-motion, lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 138. Arquivo: `CreateProject.tsx`

- **Caminho Completo:** `src\pages\CreateProject.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (9 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react-router-dom, react, ../services/board.service, ../services/client.service, ../services/team.service, ../services/project.service, ../services/auth.service, ../lib/supabase, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 139. Arquivo: `CreateTask.tsx`

- **Caminho Completo:** `src\pages\CreateTask.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react-router-dom, react, ../lib/supabase, ../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 140. Arquivo: `Dashboard.tsx`

- **Caminho Completo:** `src\pages\Dashboard.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (11 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, ../contexts/AuthContext, react-router-dom, ../components/ProductivityWidget, ../components/TaskActionMenu, ../services/task.service, ../components/TaskEditDrawer, ../utils/checklist, ../components/layout/Header/Header, ../hooks/useClickOutside
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 141. Arquivo: `Help.tsx`

- **Caminho Completo:** `src\pages\Help.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 142. Arquivo: `LandingPage.tsx`

- **Caminho Completo:** `src\pages\LandingPage.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (7 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, framer-motion, ../components/landing/mockups/MockupDashboard, ../components/landing/mockups/MockupKanban, ../components/landing/mockups/MockupTaskChat, ../components/landing/mockups/MockupTimer
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 143. Arquivo: `Legal.tsx`

- **Caminho Completo:** `src\pages\Legal.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, framer-motion, lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 144. Arquivo: `Login.tsx`

- **Caminho Completo:** `src\pages\Login.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (6 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, sonner, ../services/auth.service, ../contexts/AuthContext, ../contexts/SettingsContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 145. Arquivo: `MyQueue.tsx`

- **Caminho Completo:** `src\pages\MyQueue.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (14 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, ../contexts/AuthContext, react-router-dom, ../components/layout/Header/Header, @hello-pangea/dnd, ../components/common/Dropdown, ../components/TaskActionMenu, ../components/TaskEditDrawer, ../components/SelectDropdown, ../components/MultiSelectDropdown, ../components/WorkloadBoard, ../services/task.service, ../components/common/UserAvatar
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 146. Arquivo: `MyQueue.tsx.bak`

- **Caminho Completo:** `src\pages\MyQueue.tsx.bak`
- **Tipo:** .bak
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 147. Arquivo: `MyQueue.tsx.bak2`

- **Caminho Completo:** `src\pages\MyQueue.tsx.bak2`
- **Tipo:** .bak2
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 148. Arquivo: `NewTask.tsx`

- **Caminho Completo:** `src\pages\NewTask.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (11 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, ../lib/supabase, ../components/SimpleEditor, ../components/ModernDropdown, ../contexts/AuthContext, ../services/task.service, sonner, ../hooks/useTaskActions, ../components/MultiBoardSelector, ../types/database.types
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 149. Arquivo: `NotFound.tsx`

- **Caminho Completo:** `src\pages\NotFound.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react-router-dom, ../contexts/SettingsContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 150. Arquivo: `Profile.tsx`

- **Caminho Completo:** `src\pages\Profile.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../contexts/AuthContext, ../components/layout/Header/Header, ../lib/supabase, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 151. Arquivo: `Projects.tsx`

- **Caminho Completo:** `src\pages\Projects.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (17 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, @hello-pangea/dnd, sonner, ../components/NewColumnModal, ../components/ColumnMenu, ../components/SelectDropdown, ../components/TaskEditDrawer, ../components/TaskCard, ../components/layout/Header/Header, ../lib/supabase, ../contexts/AuthContext, ../services/client.service, ../services/project.service, ../services/task.service, ../services/board.service, ../services/team.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 152. Arquivo: `ResetPassword.tsx`

- **Caminho Completo:** `src\pages\ResetPassword.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (5 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, sonner, ../lib/supabase, ../contexts/SettingsContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 153. Arquivo: `Roadmap.tsx`

- **Caminho Completo:** `src\pages\Roadmap.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, framer-motion, lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 154. Arquivo: `Security.tsx`

- **Caminho Completo:** `src\pages\Security.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, framer-motion, lucide-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 155. Arquivo: `BoardsSettings.tsx`

- **Caminho Completo:** `src\pages\settings\BoardsSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, sonner, ../../services/board.service, ../../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 156. Arquivo: `CategoriesSettings.tsx`

- **Caminho Completo:** `src\pages\settings\CategoriesSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 157. Arquivo: `GeneralSettings.tsx`

- **Caminho Completo:** `src\pages\settings\GeneralSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (7 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, sonner, ../../services/settings.service, ../../components/ModernDropdown, ../../contexts/SettingsContext, ../../contexts/AuthContext, ../../hooks/usePermissions
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 158. Arquivo: `IntegrationsSettings.tsx`

- **Caminho Completo:** `src\pages\settings\IntegrationsSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 159. Arquivo: `NotificationsSettings.tsx`

- **Caminho Completo:** `src\pages\settings\NotificationsSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 160. Arquivo: `ProjectSettings.tsx`

- **Caminho Completo:** `src\pages\settings\ProjectSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../../lib/supabase, sonner, ../../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 161. Arquivo: `TeamsSettings.tsx`

- **Caminho Completo:** `src\pages\settings\TeamsSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, sonner, ../../services/team.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 162. Arquivo: `WorkflowsSettings.tsx`

- **Caminho Completo:** `src\pages\settings\WorkflowsSettings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (8 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, sonner, ../../lib/supabase, ../../services/board.service, ../../services/team.service, ../../components/NewWorkflowModal, ../../hooks/usePermissions, ../../contexts/AuthContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 163. Arquivo: `Settings.tsx`

- **Caminho Completo:** `src\pages\Settings.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (12 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, ../components/layout/Header/Header, ./settings/GeneralSettings, ./ClientManagement, ./TeamManagement, ./settings/IntegrationsSettings, ./settings/WorkflowsSettings, ./settings/ProjectSettings, ./settings/NotificationsSettings, ./settings/BoardsSettings, ./settings/TeamsSettings
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 164. Arquivo: `SetupPassword.tsx`

- **Caminho Completo:** `src\pages\SetupPassword.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, sonner, ../lib/supabase, ../contexts/SettingsContext
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 165. Arquivo: `SignUp.tsx`

- **Caminho Completo:** `src\pages\SignUp.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (4 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-router-dom, ../lib/supabase, sonner
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 166. Arquivo: `TaskCalendar.tsx`

- **Caminho Completo:** `src\pages\TaskCalendar.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (10 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-big-calendar, date-fns, date-fns/locale, ../lib/supabase, ../components/SelectDropdown, ../utils/checklist, react-router-dom, ../services/task.service, ../services/board.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 167. Arquivo: `TaskDetail.tsx`

- **Caminho Completo:** `src\pages\TaskDetail.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (19 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, react-dom, react-router-dom, ../lib/supabase, ../contexts/AuthContext, ../components/SimpleEditor, @tiptap/react, ../components/TaskActivityLog, ../services/activityLogger, ../services/task.service, ../utils/imageCompression, ../services/board.service, sonner, ../components/AttachmentList, ../components/layout/Header/Header, emoji-picker-react, ../hooks/usePermissions, ../components/common/UserAvatar, ../types/database.types
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 168. Arquivo: `TeamManagement.tsx`

- **Caminho Completo:** `src\pages\TeamManagement.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (6 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, ../components/MultiSelectDropdown, ../components/modals/UserDeleteModal, sonner, ../hooks/usePermissions
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 169. Arquivo: `TimeTracking.tsx`

- **Caminho Completo:** `src\pages\TimeTracking.tsx`
- **Tipo:** .tsx
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (9 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** function
- **Importa:** react, ../lib/supabase, ../contexts/AuthContext, ../components/time-tracking/LiveTimerWidget, ../components/time-tracking/WeeklyTimesheet, ../components/time-tracking/DailyTimeline, ../components/time-tracking/PerformancePanel, ../components/ModernDropdown, ../components/time-tracking/TeamReport
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 170. Arquivo: `activityLogger.ts`

- **Caminho Completo:** `src\services\activityLogger.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** ActivityType, logActivity
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 171. Arquivo: `admin.service.ts`

- **Caminho Completo:** `src\services\admin.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** SaasMetric, OrgDetails, SystemStats, adminService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 172. Arquivo: `auth.service.test.ts`

- **Caminho Completo:** `src\services\auth.service.test.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** vitest, ./auth.service, ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 173. Arquivo: `auth.service.ts`

- **Caminho Completo:** `src\services\auth.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** authService
- **Importa:** ../lib/supabase, ../types/auth, @supabase/supabase-js
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 174. Arquivo: `board.service.ts`

- **Caminho Completo:** `src\services\board.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Board, boardService, Column
- **Importa:** ../lib/supabase, ./auth.service
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 175. Arquivo: `client.service.ts`

- **Caminho Completo:** `src\services\client.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Client, clientService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 176. Arquivo: `notification.service.ts`

- **Caminho Completo:** `src\services\notification.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Notification, notificationService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 177. Arquivo: `portfolio.service.ts`

- **Caminho Completo:** `src\services\portfolio.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** ProjectHealth, TeamLoad, PortfolioSummary, portfolioService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 178. Arquivo: `project.service.ts`

- **Caminho Completo:** `src\services\project.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Project, Column, projectService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 179. Arquivo: `report.service.ts`

- **Caminho Completo:** `src\services\report.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** TraceabilityRow, FidelityMetric, ClientSummary, DailyActivityBlock, CategoryMetric, reportService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 180. Arquivo: `settings.service.ts`

- **Caminho Completo:** `src\services\settings.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** SystemSettings, settingsService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 181. Arquivo: `task.service.ts`

- **Caminho Completo:** `src\services\task.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Task, CreateTaskDTO, UpdateTaskDTO, taskService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 182. Arquivo: `team.service.ts`

- **Caminho Completo:** `src\services\team.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Team, teamService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 183. Arquivo: `workflow.service.ts`

- **Caminho Completo:** `src\services\workflow.service.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Workflow, workflowService
- **Importa:** ../lib/supabase
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 184. Arquivo: `auth.ts`

- **Caminho Completo:** `src\types\auth.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Definições de tipos TypeScript (Interfaces, Types) usados na aplicação.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** IUserProfile
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 185. Arquivo: `database.types.ts`

- **Caminho Completo:** `src\types\database.types.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Definições de tipos TypeScript (Interfaces, Types) usados na aplicação.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Json, Database, Board, Project
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 186. Arquivo: `checklist.ts`

- **Caminho Completo:** `src\utils\checklist.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** extractChecklistFromHtml
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 187. Arquivo: `imageCompression.ts`

- **Caminho Completo:** `src\utils\imageCompression.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (1 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** compressImage
- **Importa:** browser-image-compression
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 188. Arquivo: `cli-latest`

- **Caminho Completo:** `supabase\.temp\cli-latest`
- **Tipo:** Arquivo sem extensão
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 189. Arquivo: `audit_query.sql`

- **Caminho Completo:** `supabase\audit_query.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 190. Arquivo: `emergency_disable_rls.sql`

- **Caminho Completo:** `supabase\emergency_disable_rls.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 191. Arquivo: `emergency_fix_negative_time.sql`

- **Caminho Completo:** `supabase\emergency_fix_negative_time.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 192. Arquivo: `fix_massive_outliers.sql`

- **Caminho Completo:** `supabase\fix_massive_outliers.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 193. Arquivo: `fix_null_users.sql`

- **Caminho Completo:** `supabase\fix_null_users.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 194. Arquivo: `fix_task_51_timer.sql`

- **Caminho Completo:** `supabase\fix_task_51_timer.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 195. Arquivo: `index.ts`

- **Caminho Completo:** `supabase\functions\check-deadlines\index.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** https://deno.land/std@0.168.0/http/server.ts, https://esm.sh/@supabase/supabase-js@2
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 196. Arquivo: `index.ts`

- **Caminho Completo:** `supabase\functions\send-notification\index.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (3 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** https://deno.land/std@0.168.0/http/server.ts, https://esm.sh/@supabase/supabase-js@2, https://deno.land/x/smtp@v0.7.0/mod.ts
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 197. Arquivo: `investigate_outliers.sql`

- **Caminho Completo:** `supabase\investigate_outliers.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 198. Arquivo: `20251229_add_description_to_time_logs.sql`

- **Caminho Completo:** `supabase\migrations\20251229_add_description_to_time_logs.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 199. Arquivo: `20251229_dynamic_kanban.sql`

- **Caminho Completo:** `supabase\migrations\20251229_dynamic_kanban.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: project_columns
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 200. Arquivo: `20251229_optimize_kanban.sql`

- **Caminho Completo:** `supabase\migrations\20251229_optimize_kanban.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 201. Arquivo: `20251230_add_client_default_board.sql`

- **Caminho Completo:** `supabase\migrations\20251230_add_client_default_board.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 202. Arquivo: `20251230_add_client_structure.sql`

- **Caminho Completo:** `supabase\migrations\20251230_add_client_structure.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 203. Arquivo: `20251230_add_favicon_url.sql`

- **Caminho Completo:** `supabase\migrations\20251230_add_favicon_url.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 204. Arquivo: `20251230_add_theme_preference.sql`

- **Caminho Completo:** `supabase\migrations\20251230_add_theme_preference.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 205. Arquivo: `20251230_create_system_settings.sql`

- **Caminho Completo:** `supabase\migrations\20251230_create_system_settings.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 206. Arquivo: `20251230_emergency_fix.sql`

- **Caminho Completo:** `supabase\migrations\20251230_emergency_fix.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 207. Arquivo: `20251230_link_tasks_to_board_columns.sql`

- **Caminho Completo:** `supabase\migrations\20251230_link_tasks_to_board_columns.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 208. Arquivo: `20251230_link_workflows_to_boards.sql`

- **Caminho Completo:** `supabase\migrations\20251230_link_workflows_to_boards.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 209. Arquivo: `20251230_migrate_columns_to_boards.sql`

- **Caminho Completo:** `supabase\migrations\20251230_migrate_columns_to_boards.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: board_columns
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 210. Arquivo: `20251230_sync_user_teams.sql`

- **Caminho Completo:** `supabase\migrations\20251230_sync_user_teams.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 211. Arquivo: `20251231_create_storage_bucket.sql`

- **Caminho Completo:** `supabase\migrations\20251231_create_storage_bucket.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 212. Arquivo: `20251231_expose_settings_public.sql`

- **Caminho Completo:** `supabase\migrations\20251231_expose_settings_public.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 213. Arquivo: `20251231_handle_new_user_trigger.sql`

- **Caminho Completo:** `supabase\migrations\20251231_handle_new_user_trigger.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 214. Arquivo: `20260105_add_client_default_team.sql`

- **Caminho Completo:** `supabase\migrations\20260105_add_client_default_team.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 215. Arquivo: `20260105_auto_sync_auth_users.sql`

- **Caminho Completo:** `supabase\migrations\20260105_auto_sync_auth_users.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 216. Arquivo: `20260105_create_notification_preferences.sql`

- **Caminho Completo:** `supabase\migrations\20260105_create_notification_preferences.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 217. Arquivo: `20260105_create_task_boards.sql`

- **Caminho Completo:** `supabase\migrations\20260105_create_task_boards.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 218. Arquivo: `20260105_ensure_user_profile_rpc.sql`

- **Caminho Completo:** `supabase\migrations\20260105_ensure_user_profile_rpc.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: with, Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 219. Arquivo: `20260105_fix_clients_rls.sql`

- **Caminho Completo:** `supabase\migrations\20260105_fix_clients_rls.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 220. Arquivo: `20260105_fix_project_client_ids.sql`

- **Caminho Completo:** `supabase\migrations\20260105_fix_project_client_ids.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 221. Arquivo: `20260105_fix_queue_access_additive.sql`

- **Caminho Completo:** `supabase\migrations\20260105_fix_queue_access_additive.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 222. Arquivo: `20260105_fix_users_rls_complete.sql`

- **Caminho Completo:** `supabase\migrations\20260105_fix_users_rls_complete.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 223. Arquivo: `20260105_fix_users_rls_policy.sql`

- **Caminho Completo:** `supabase\migrations\20260105_fix_users_rls_policy.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 224. Arquivo: `20260105_project_hierarchy_integrity.sql`

- **Caminho Completo:** `supabase\migrations\20260105_project_hierarchy_integrity.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 225. Arquivo: `20260105_update_triggers_for_email.sql`

- **Caminho Completo:** `supabase\migrations\20260105_update_triggers_for_email.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: is_status_returned, Function: notify_edge_function, Function: notify_comment_edge_function
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 226. Arquivo: `20260106_add_task_position_column.sql`

- **Caminho Completo:** `supabase\migrations\20260106_add_task_position_column.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 227. Arquivo: `20260106_fix_admin_permissions_and_delete_user.sql`

- **Caminho Completo:** `supabase\migrations\20260106_fix_admin_permissions_and_delete_user.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 228. Arquivo: `20260106_fix_delete_user_rpc_v3_column_name.sql`

- **Caminho Completo:** `supabase\migrations\20260106_fix_delete_user_rpc_v3_column_name.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 229. Arquivo: `20260106_fix_tasks_rls_for_admins.sql`

- **Caminho Completo:** `supabase\migrations\20260106_fix_tasks_rls_for_admins.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 230. Arquivo: `20260106_update_delete_user_rpc_v2.sql`

- **Caminho Completo:** `supabase\migrations\20260106_update_delete_user_rpc_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 231. Arquivo: `20260107165500_shield_protocol.sql`

- **Caminho Completo:** `supabase\migrations\20260107165500_shield_protocol.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 232. Arquivo: `20260107170500_shield_patch_autofill.sql`

- **Caminho Completo:** `supabase\migrations\20260107170500_shield_patch_autofill.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 233. Arquivo: `20260107171000_shield_fix_v2.sql`

- **Caminho Completo:** `supabase\migrations\20260107171000_shield_fix_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 234. Arquivo: `20260107171500_shield_fix_v3_missing_policies.sql`

- **Caminho Completo:** `supabase\migrations\20260107171500_shield_fix_v3_missing_policies.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 235. Arquivo: `20260107174000_ghost_user_diagnosis.sql`

- **Caminho Completo:** `supabase\migrations\20260107174000_ghost_user_diagnosis.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 236. Arquivo: `20260107174500_ghost_user_cleanup.sql`

- **Caminho Completo:** `supabase\migrations\20260107174500_ghost_user_cleanup.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 237. Arquivo: `20260107180000_sync_last_seen.sql`

- **Caminho Completo:** `supabase\migrations\20260107180000_sync_last_seen.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 238. Arquivo: `20260107190000_notifications_core.sql`

- **Caminho Completo:** `supabase\migrations\20260107190000_notifications_core.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 239. Arquivo: `20260107210000_fix_user_creation.sql`

- **Caminho Completo:** `supabase\migrations\20260107210000_fix_user_creation.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 240. Arquivo: `20260107223000_notifications_extended.sql`

- **Caminho Completo:** `supabase\migrations\20260107223000_notifications_extended.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 241. Arquivo: `20260107224500_fix_notification_status_names.sql`

- **Caminho Completo:** `supabase\migrations\20260107224500_fix_notification_status_names.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 242. Arquivo: `20260107225500_add_mentions_column.sql`

- **Caminho Completo:** `supabase\migrations\20260107225500_add_mentions_column.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 243. Arquivo: `20260107230000_refine_notification_content.sql`

- **Caminho Completo:** `supabase\migrations\20260107230000_refine_notification_content.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 244. Arquivo: `20260107231500_fix_notification_titles.sql`

- **Caminho Completo:** `supabase\migrations\20260107231500_fix_notification_titles.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 245. Arquivo: `20260107233000_fix_comment_notifications.sql`

- **Caminho Completo:** `supabase\migrations\20260107233000_fix_comment_notifications.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 246. Arquivo: `20260108_activity_log.sql`

- **Caminho Completo:** `supabase\migrations\20260108_activity_log.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Table: CREATE
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 247. Arquivo: `20260108_allow_manager_delete_tasks.sql`

- **Caminho Completo:** `supabase\migrations\20260108_allow_manager_delete_tasks.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 248. Arquivo: `20260108_audit_time_tracking.sql`

- **Caminho Completo:** `supabase\migrations\20260108_audit_time_tracking.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 249. Arquivo: `20260108_cleanup_legacy_roles.sql`

- **Caminho Completo:** `supabase\migrations\20260108_cleanup_legacy_roles.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 250. Arquivo: `20260108_collaborative_flow.sql`

- **Caminho Completo:** `supabase\migrations\20260108_collaborative_flow.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 251. Arquivo: `20260108_create_task_attachments.sql`

- **Caminho Completo:** `supabase\migrations\20260108_create_task_attachments.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 252. Arquivo: `20260108_create_task_attachments_v2.sql`

- **Caminho Completo:** `supabase\migrations\20260108_create_task_attachments_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 253. Arquivo: `20260108_emergency_fix_constraints.sql`

- **Caminho Completo:** `supabase\migrations\20260108_emergency_fix_constraints.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 254. Arquivo: `20260108_fix_activity_log_schema.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_activity_log_schema.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 255. Arquivo: `20260108_fix_delete_bug_final.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_delete_bug_final.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 256. Arquivo: `20260108_fix_delete_final_v2.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_delete_final_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 257. Arquivo: `20260108_fix_delete_user_transfer.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_delete_user_transfer.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 258. Arquivo: `20260108_fix_legacy_columns.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_legacy_columns.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 259. Arquivo: `20260108_fix_notification_html_sanitization.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_notification_html_sanitization.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Function: notify_edge_function
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 260. Arquivo: `20260108_fix_null_interceptor.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_null_interceptor.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 261. Arquivo: `20260108_fix_trigger_logic_v3.sql`

- **Caminho Completo:** `supabase\migrations\20260108_fix_trigger_logic_v3.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 262. Arquivo: `20260108_prevent_role_escalation.sql`

- **Caminho Completo:** `supabase\migrations\20260108_prevent_role_escalation.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 263. Arquivo: `20260108_refine_notifications_v3.sql`

- **Caminho Completo:** `supabase\migrations\20260108_refine_notifications_v3.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 264. Arquivo: `20260108_rename_operator_to_member.sql`

- **Caminho Completo:** `supabase\migrations\20260108_rename_operator_to_member.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 265. Arquivo: `20260108_rename_operator_to_member_fix.sql`

- **Caminho Completo:** `supabase\migrations\20260108_rename_operator_to_member_fix.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 266. Arquivo: `20260108_rename_operator_to_member_fix_v2.sql`

- **Caminho Completo:** `supabase\migrations\20260108_rename_operator_to_member_fix_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 267. Arquivo: `20260108_security_hardness.sql`

- **Caminho Completo:** `supabase\migrations\20260108_security_hardness.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 268. Arquivo: `20260109_auto_calculate_duration.sql`

- **Caminho Completo:** `supabase\migrations\20260109_auto_calculate_duration.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: calculate_time_log_duration
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 269. Arquivo: `20260109_enforce_one_active_timer.sql`

- **Caminho Completo:** `supabase\migrations\20260109_enforce_one_active_timer.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: handle_unique_active_timer
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 270. Arquivo: `20260109_fix_storage_permissions.sql`

- **Caminho Completo:** `supabase\migrations\20260109_fix_storage_permissions.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 271. Arquivo: `20260109_restrict_settings_access.sql`

- **Caminho Completo:** `supabase\migrations\20260109_restrict_settings_access.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 272. Arquivo: `20260109_user_onboarding_flow.sql`

- **Caminho Completo:** `supabase\migrations\20260109_user_onboarding_flow.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 273. Arquivo: `20260112_add_billing_schema.sql`

- **Caminho Completo:** `supabase\migrations\20260112_add_billing_schema.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 274. Arquivo: `20260112_add_is_continuous_to_tasks.sql`

- **Caminho Completo:** `supabase\migrations\20260112_add_is_continuous_to_tasks.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 275. Arquivo: `20260112_add_limits_to_rpc.sql`

- **Caminho Completo:** `supabase\migrations\20260112_add_limits_to_rpc.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 276. Arquivo: `20260112_atomic_timer.sql`

- **Caminho Completo:** `supabase\migrations\20260112_atomic_timer.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: start_task_timer
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 277. Arquivo: `20260112_auto_pause_cron.sql`

- **Caminho Completo:** `supabase\migrations\20260112_auto_pause_cron.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: check_auto_pause_status, Function: dismiss_auto_pause_alert, Function: check_and_pause_timers
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 278. Arquivo: `20260112_auto_pause_settings.sql`

- **Caminho Completo:** `supabase\migrations\20260112_auto_pause_settings.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 279. Arquivo: `20260112_broadcast_system.sql`

- **Caminho Completo:** `supabase\migrations\20260112_broadcast_system.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 280. Arquivo: `20260112_calendar_workload.sql`

- **Caminho Completo:** `supabase\migrations\20260112_calendar_workload.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 281. Arquivo: `20260112_create_saas_dashboard.sql`

- **Caminho Completo:** `supabase\migrations\20260112_create_saas_dashboard.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 282. Arquivo: `20260112_enable_public_signup.sql`

- **Caminho Completo:** `supabase\migrations\20260112_enable_public_signup.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 283. Arquivo: `20260112_enforce_quotas.sql`

- **Caminho Completo:** `supabase\migrations\20260112_enforce_quotas.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 284. Arquivo: `20260112_feature_usage_stats.sql`

- **Caminho Completo:** `supabase\migrations\20260112_feature_usage_stats.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 285. Arquivo: `20260112_fix_board_defaults.sql`

- **Caminho Completo:** `supabase\migrations\20260112_fix_board_defaults.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 286. Arquivo: `20260112_get_system_stats.sql`

- **Caminho Completo:** `supabase\migrations\20260112_get_system_stats.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 287. Arquivo: `20260112_god_mode_rls.sql`

- **Caminho Completo:** `supabase\migrations\20260112_god_mode_rls.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 288. Arquivo: `20260112_saas_details.sql`

- **Caminho Completo:** `supabase\migrations\20260112_saas_details.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 289. Arquivo: `20260112_saas_metrics_history.sql`

- **Caminho Completo:** `supabase\migrations\20260112_saas_metrics_history.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 290. Arquivo: `20260113_add_super_admin_flag.sql`

- **Caminho Completo:** `supabase\migrations\20260113_add_super_admin_flag.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 291. Arquivo: `20260113_advanced_admin_management.sql`

- **Caminho Completo:** `supabase\migrations\20260113_advanced_admin_management.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 292. Arquivo: `20260113_fix_org_access_and_quotas.sql`

- **Caminho Completo:** `supabase\migrations\20260113_fix_org_access_and_quotas.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 293. Arquivo: `20260113_org_deletion_cascade.sql`

- **Caminho Completo:** `supabase\migrations\20260113_org_deletion_cascade.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 294. Arquivo: `20260113_security_p0_unification.sql`

- **Caminho Completo:** `supabase\migrations\20260113_security_p0_unification.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 295. Arquivo: `20260114_fix_users_rls.sql`

- **Caminho Completo:** `supabase\migrations\20260114_fix_users_rls.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 296. Arquivo: `20260114_time_tracking_net_balance.sql`

- **Caminho Completo:** `supabase\migrations\20260114_time_tracking_net_balance.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 297. Arquivo: `20260116_simplify_rls_final.sql`

- **Caminho Completo:** `supabase\migrations\20260116_simplify_rls_final.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 298. Arquivo: `20260123_jwt_sync_optimization.sql`

- **Caminho Completo:** `supabase\migrations\20260123_jwt_sync_optimization.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 299. Arquivo: `20260123_nuclear_policy_reset.sql`

- **Caminho Completo:** `supabase\migrations\20260123_nuclear_policy_reset.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 300. Arquivo: `20260123_nuclear_policy_reset_v2.sql`

- **Caminho Completo:** `supabase\migrations\20260123_nuclear_policy_reset_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 301. Arquivo: `20260123_rls_fix_part2_gap_filling.sql`

- **Caminho Completo:** `supabase\migrations\20260123_rls_fix_part2_gap_filling.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 302. Arquivo: `20260123_rls_fix_part3_final_sweep.sql`

- **Caminho Completo:** `supabase\migrations\20260123_rls_fix_part3_final_sweep.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 303. Arquivo: `20260123_urgent_rls_fix.sql`

- **Caminho Completo:** `supabase\migrations\20260123_urgent_rls_fix.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 304. Arquivo: `20260226_update_super_admin_mauricio.sql`

- **Caminho Completo:** `supabase\migrations\20260226_update_super_admin_mauricio.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 305. Arquivo: `add_entry_category_to_time_logs.sql`

- **Caminho Completo:** `supabase\migrations\add_entry_category_to_time_logs.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 306. Arquivo: `audit_mktnow_users.sql`

- **Caminho Completo:** `supabase\migrations\audit_mktnow_users.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 307. Arquivo: `check_org_columns.sql`

- **Caminho Completo:** `supabase\migrations\check_org_columns.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 308. Arquivo: `check_passo_leftovers.sql`

- **Caminho Completo:** `supabase\migrations\check_passo_leftovers.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 309. Arquivo: `check_policies_and_users.sql`

- **Caminho Completo:** `supabase\migrations\check_policies_and_users.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 310. Arquivo: `check_policies_and_users_v2.sql`

- **Caminho Completo:** `supabase\migrations\check_policies_and_users_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 311. Arquivo: `create_boards_structure.sql`

- **Caminho Completo:** `supabase\migrations\create_boards_structure.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: boards, Table: board_members
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 312. Arquivo: `create_notifications_system.sql`

- **Caminho Completo:** `supabase\migrations\create_notifications_system.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: handle_task_assignment, Function: handle_task_movement, Function: handle_new_comment, Table: notifications
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 313. Arquivo: `create_task_assignees.sql`

- **Caminho Completo:** `supabase\migrations\create_task_assignees.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 314. Arquivo: `debug_tasks_rls.sql`

- **Caminho Completo:** `supabase\migrations\debug_tasks_rls.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 315. Arquivo: `debug_task_61.sql`

- **Caminho Completo:** `supabase\migrations\debug_task_61.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 316. Arquivo: `delete_renan_check_others.sql`

- **Caminho Completo:** `supabase\migrations\delete_renan_check_others.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 317. Arquivo: `diagnostic_leak_investigation.sql`

- **Caminho Completo:** `supabase\migrations\diagnostic_leak_investigation.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 318. Arquivo: `diagnostic_leak_investigation_v2.sql`

- **Caminho Completo:** `supabase\migrations\diagnostic_leak_investigation_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 319. Arquivo: `diagnostic_rls.sql`

- **Caminho Completo:** `supabase\migrations\diagnostic_rls.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 320. Arquivo: `emergency_fix_user_creation.sql`

- **Caminho Completo:** `supabase\migrations\emergency_fix_user_creation.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 321. Arquivo: `emergency_lockdown.sql`

- **Caminho Completo:** `supabase\migrations\emergency_lockdown.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 322. Arquivo: `ensure_task_attachments_bucket.sql`

- **Caminho Completo:** `supabase\migrations\ensure_task_attachments_bucket.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 323. Arquivo: `final_diagnostic.sql`

- **Caminho Completo:** `supabase\migrations\final_diagnostic.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 324. Arquivo: `find_migrated_intruders.sql`

- **Caminho Completo:** `supabase\migrations\find_migrated_intruders.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 325. Arquivo: `fix_task_boards_relationship.sql`

- **Caminho Completo:** `supabase\migrations\fix_task_boards_relationship.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: create
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 326. Arquivo: `forensic_ghost_users.sql`

- **Caminho Completo:** `supabase\migrations\forensic_ghost_users.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 327. Arquivo: `manual_delete_org_omnitrion.sql`

- **Caminho Completo:** `supabase\migrations\manual_delete_org_omnitrion.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 328. Arquivo: `manual_delete_org_passo.sql`

- **Caminho Completo:** `supabase\migrations\manual_delete_org_passo.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 329. Arquivo: `manual_fix_full_system.sql`

- **Caminho Completo:** `supabase\migrations\manual_fix_full_system.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Function: public, Table: public
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 330. Arquivo: `manual_fix_merge_projects.sql`

- **Caminho Completo:** `supabase\migrations\manual_fix_merge_projects.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 331. Arquivo: `manual_fix_merge_projects_v2.sql`

- **Caminho Completo:** `supabase\migrations\manual_fix_merge_projects_v2.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 332. Arquivo: `manual_fix_migrate_legacy_clients.sql`

- **Caminho Completo:** `supabase\migrations\manual_fix_migrate_legacy_clients.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 333. Arquivo: `restore_system_access.sql`

- **Caminho Completo:** `supabase\migrations\restore_system_access.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 334. Arquivo: `reveal_intruders.sql`

- **Caminho Completo:** `supabase\migrations\reveal_intruders.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 335. Arquivo: `user_teams.sql`

- **Caminho Completo:** `supabase\migrations\user_teams.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Table: user_teams
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 336. Arquivo: `SUPABASE_SETUP.md`

- **Caminho Completo:** `SUPABASE_SETUP.md`
- **Tipo:** .md
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de documentação existente.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 337. Arquivo: `tailwind.config.js`

- **Caminho Completo:** `tailwind.config.js`
- **Tipo:** .js
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** default
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 338. Arquivo: `temp_task_data.json`

- **Caminho Completo:** `temp_task_data.json`
- **Tipo:** .json
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 339. Arquivo: `tsconfig.app.json`

- **Caminho Completo:** `tsconfig.app.json`
- **Tipo:** .json
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 340. Arquivo: `tsconfig.json`

- **Caminho Completo:** `tsconfig.json`
- **Tipo:** .json
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Configuração do compilador TypeScript.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 341. Arquivo: `tsconfig.node.json`

- **Caminho Completo:** `tsconfig.node.json`
- **Tipo:** .json
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 342. Arquivo: `update_schema_team_reports.sql`

- **Caminho Completo:** `update_schema_team_reports.sql`
- **Tipo:** .sql
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 343. Arquivo: `vercel.json`

- **Caminho Completo:** `vercel.json`
- **Tipo:** .json
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 344. Arquivo: `verify_db.ts`

- **Caminho Completo:** `verify_db.ts`
- **Tipo:** .ts
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** @supabase/supabase-js, dotenv
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 345. Arquivo: `vite.config.ts`

- **Caminho Completo:** `vite.config.ts`
- **Tipo:** .ts
- **Classificação:** Essencial
- **Responsabilidade Principal:** Arquivo de configuração / script / genérico.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (2 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** defineConfig
- **Importa:** vite, @vitejs/plugin-react
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

### 346. Arquivo: `WALKTHROUGH.md`

- **Caminho Completo:** `WALKTHROUGH.md`
- **Tipo:** .md
- **Classificação:** Auxiliar / Regra de Negócio
- **Responsabilidade Principal:** Arquivo de documentação existente.
- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (0 imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.
- **Exporta:** Nenhuma exportação explícita detectada
- **Importa:** Nenhum import explícito detectado (ou é script SQL/JSON/Config)
- **Dependências Externas / Internas:** Requer bibliotecas do `node_modules` associadas aos imports acima.
- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.
---

## 4. DEPENDÊNCIAS INTERNAS (node_modules)
A pasta `node_modules` contém toda a infraestrutura de bibliotecas do projeto. Abaixo listamos as dependências registradas no escopo do projeto (ao invés de listar milhares de arquivos da pasta node_modules individualmente):

**Dependencies:**
- `@hello-pangea/dnd`: `^18.0.1`
- `@supabase/supabase-js`: `^2.88.0`
- `@tailwindcss/postcss`: `^4.1.18`
- `@tiptap/extension-code-block`: `^3.14.0`
- `@tiptap/extension-color`: `^3.14.0`
- `@tiptap/extension-font-family`: `^3.14.0`
- `@tiptap/extension-image`: `^3.14.0`
- `@tiptap/extension-link`: `^3.14.0`
- `@tiptap/extension-mention`: `^3.15.3`
- `@tiptap/extension-placeholder`: `^3.14.0`
- `@tiptap/extension-task-item`: `^3.14.0`
- `@tiptap/extension-task-list`: `^3.14.0`
- `@tiptap/extension-text-align`: `^3.14.0`
- `@tiptap/extension-text-style`: `^3.14.0`
- `@tiptap/extension-underline`: `^3.14.0`
- `@tiptap/react`: `^3.14.0`
- `@tiptap/starter-kit`: `^3.14.0`
- `@types/react-big-calendar`: `^1.16.3`
- `browser-image-compression`: `^2.0.2`
- `clsx`: `^2.1.1`
- `date-fns`: `^4.1.0`
- `dotenv`: `^17.2.3`
- `emoji-picker-react`: `^4.16.1`
- `framer-motion`: `^12.26.1`
- `fuse.js`: `^7.1.0`
- `jspdf`: `^3.0.4`
- `jspdf-autotable`: `^5.0.2`
- `lucide-react`: `^0.561.0`
- `react`: `^19.2.0`
- `react-big-calendar`: `^1.19.4`
- `react-dom`: `^19.2.0`
- `react-router-dom`: `^7.10.1`
- `recharts`: `^3.6.0`
- `sonner`: `^2.0.7`
- `tailwind-merge`: `^3.4.0`
- `tippy.js`: `^6.3.7`
- `tiptap-extension-resize-image`: `^1.3.2`

**DevDependencies:**
- `@eslint/js`: `^9.39.1`
- `@testing-library/jest-dom`: `^6.9.1`
- `@testing-library/react`: `^16.3.1`
- `@types/node`: `^24.10.1`
- `@types/react`: `^19.2.5`
- `@types/react-dom`: `^19.2.3`
- `@vitejs/plugin-react`: `^5.1.1`
- `autoprefixer`: `^10.4.23`
- `eslint`: `^9.39.1`
- `eslint-plugin-react-hooks`: `^7.0.1`
- `eslint-plugin-react-refresh`: `^0.4.24`
- `globals`: `^16.5.0`
- `jsdom`: `^27.4.0`
- `postcss`: `^8.5.6`
- `tailwindcss`: `^4.1.18`
- `typescript`: `~5.9.3`
- `typescript-eslint`: `^8.46.4`
- `vite`: `^7.2.4`
- `vitest`: `^4.0.16`

**Riscos node_modules:** Alterações manuais dentro da pasta node_modules serão perdidas e são **altamente não recomendadas**. Use o npm/yarn para atualizações.

## 5. REPOSITÓRIO E CONTROLE DE VERSÃO (.git)
A pasta `.git/` (oculta) mantém a árvore de histórico de versões, commits, branches, refs locais e arquivos de configurações de deploy em cloud/github. Representa o estado legado e corrente (HEAD) do código fonte.

>FIM DO DOCUMENTO
>Gerado automaticamente com detalhamento individual para 346 arquivos essenciais da aplicação.
