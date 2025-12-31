# Configuração do Supabase

Siga estes passos para configurar o banco de dados do NowFlow:

1.  **Crie um Projeto no Supabase**
    *   Acesse [supabase.com](https://supabase.com/) e crie um novo projeto.

2.  **Execute o Schema SQL**
    *   No painel do Supabase, vá para **SQL Editor** (ícone de terminal na barra lateral esquerda).
    *   Clique em **New Query**.
    *   Copie o conteúdo do arquivo `schema.sql` (localizado na raiz do projeto `nowflow-app`).
    *   Cole no editor e clique em **Run**.

3.  **Configurar Variáveis de Ambiente**
    *   Crie um arquivo `.env` na raiz do projeto `nowflow-app`.
    *   Adicione as chaves de API do Supabase (Settings -> API):
        ```env
        VITE_SUPABASE_URL=sua-url-do-projeto
        VITE_SUPABASE_ANON_KEY=sua-chave-anonima
        ```

4.  **Verificar Tabelas**
    *   Vá para **Table Editor** e verifique se as tabelas (users, projects, tasks, clients, etc.) foram criadas corretamente.

Agora seu backend está pronto para uso!
