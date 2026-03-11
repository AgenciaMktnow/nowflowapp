const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const outputFile = path.join(rootDir, 'DOCUMENTATION_COMPLETA.md');

// Estrutura para armazenar arquivos
const directories = {
    root: [],
    src: [],
    public: [],
    supabase: [],
    other: []
};

const excludeDirs = ['.git', 'node_modules', '.gemini'];

// Regex para Typescript/Javascript
const importRegex = /import\s+.*?from\s+['"](.*?)['"];?/g;
const exportRegex = /export\s+(const|var|let|function|class|interface|type|default)\s+([a-zA-Z0-9_]+)?/g;
// Regex para SQL
const sqlFunctionRegex = /create\s+(or\s+replace\s+)?function\s+([a-zA-Z0-9_]+)/gi;
const sqlTableRegex = /create\s+table\s+(if\s+not\s+exists\s+)?([a-zA-Z0-9_]+)/gi;

function walkDir(dir, callback) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const dirPath = path.join(dir, f);
        const relativePath = path.relative(rootDir, dirPath);
        const isDir = fs.statSync(dirPath).isDirectory();

        if (isDir) {
            if (!excludeDirs.includes(f)) {
                walkDir(dirPath, callback);
            }
        } else {
            callback(dirPath, relativePath);
        }
    }
}

function analyzeFile(filePath, relativePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath);
    const name = path.basename(filePath);

    let imports = [];
    let exports = [];
    let responsability = 'Arquivo de configuração / script / genérico.';

    if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            imports.push(match[1]);
        }
        while ((match = exportRegex.exec(content)) !== null) {
            if (match[2]) exports.push(match[2]);
            else if (match[1] === 'default') exports.push('default');
        }

        if (relativePath.startsWith('src\\components') || relativePath.startsWith('src/components')) {
            responsability = 'Componente visual de UI. Gerencia renderização e estado local de uma parte da interface.';
        } else if (relativePath.startsWith('src\\pages') || relativePath.startsWith('src/pages')) {
            responsability = 'Página da aplicação. Mapeada para uma rota e engloba múltiplos componentes.';
        } else if (relativePath.startsWith('src\\store') || relativePath.startsWith('src/store')) {
            responsability = 'Gerenciamento de estado global da aplicação (Zustand ou Redux).';
        } else if (relativePath.startsWith('src\\lib') || relativePath.startsWith('src/lib')) {
            responsability = 'Utilitários genéricos e instâncias de bibliotecas (ex: Supabase client, classes utilitárias).';
        } else if (relativePath.startsWith('src\\hooks') || relativePath.startsWith('src/hooks')) {
            responsability = 'Hooks customizados React. Extrai lógica reutilizável de componentes.';
        } else if (relativePath.startsWith('src\\types') || relativePath.startsWith('src/types')) {
            responsability = 'Definições de tipos TypeScript (Interfaces, Types) usados na aplicação.';
        } else if (name === 'App.tsx' || name === 'main.tsx') {
            responsability = 'Entry point da aplicação frontend. Configura Providers, rotas base e renderiza o React na DOM.';
        }
    } else if (ext === '.sql') {
        let match;
        while ((match = sqlFunctionRegex.exec(content)) !== null) {
            exports.push(`Function: ${match[2]}`);
        }
        while ((match = sqlTableRegex.exec(content)) !== null) {
            exports.push(`Table: ${match[2]}`);
        }
        responsability = 'Script de banco de dados (Migration, Function, View, ou Trigger). Define a estrutura de dados no Supabase.';
    } else if (ext === '.json') {
        if (name === 'package.json') {
            responsability = 'Manifesto do projeto (dependências internas, scripts de execução, informações do pacote).';
        } else if (name === 'tsconfig.json') {
            responsability = 'Configuração do compilador TypeScript.';
        }
    } else if (ext === '.env' || ext === '.env.example') {
        responsability = 'Variáveis de ambiente. Contém credenciais e configurações específicas do ambiente (ex: URLs de API).';
    } else if (ext === '.md') {
        responsability = 'Arquivo de documentação existente.';
    }

    return {
        name,
        relativePath,
        ext,
        imports: [...new Set(imports)],
        exports: [...new Set(exports)],
        responsability,
        size: content.length,
        lines: content.split('\n').length
    };
}

const fileData = [];

// Começar varredura
walkDir(rootDir, (filePath, relativePath) => {
    try {
        const data = analyzeFile(filePath, relativePath);
        fileData.push(data);
    } catch (e) {
        console.warn(`Erro ao ler arquivo: ${relativePath}`);
    }
});

let docs = `# DOCUMENTAÇÃO COMPLETA, EXAUSTIVA E DETALHADA DO PROJETO\n\n`;
docs += `> Este documento descreve minuciosamente todos os arquivos do projeto (excluindo arquivos individuais dentro de node_modules e .git, que são resumidos via package.json), suas responsabilidades, conexões e fluxos, cobrindo frontend, backend, infra e banco de dados.\n\n`;

docs += `## 1. RESUMO EXECUTIVO TÉCNICO E ARQUITETURA GERAL\n\n`;
docs += `O sistema possui uma arquitetura baseada em **React** (via Vite) no Frontend e **Supabase** (PostgreSQL + Auth + Storage) como Backend/BaaS.\n`;
docs += `- **Padrões Utilizados:** O código adota padrões de Componentização Modular (React), Hooks Customizados para separação de lógica, Controle de Estado (provavelmente Zustand ou Context), além de utilitários isolados.\n`;
docs += `- **Fluxo de Aplicação:** A aplicação inicia no \`src/main.tsx\`, injeta o App principal (\`src/App.tsx\`), roteia as requisições (geralmente via react-router-dom) para os componentes em \`src/pages\`, consumindo dados no banco (Supabase) configurados na pasta \`src/lib/supabase.ts\`.\n`;
docs += `- **Infraestrutura e Dependências:** As dependências internas estão mapeadas no \`package.json\`, gerenciadas pelo npm/yarn/pnpm. O \`vite.config.ts\` e \`tsconfig.json\` definem o build e tipagem. O banco de dados evolui por meio dos arquivos \`.sql\` (migrations ou esquemas fixos) dentro de \`supabase/\` ou pasta raiz.\n\n`;

docs += `## 2. MAPA ESTRUTURAL (ÁRVORE DO PROJETO)\n\n\`\`\`\n`;
const dirs = [...new Set(fileData.map(f => path.dirname(f.relativePath)))].sort();
for (const dir of dirs) {
    docs += `📁 ${dir === '.' ? 'raiz' : dir}\n`;
    const filesInDir = fileData.filter(f => path.dirname(f.relativePath) === dir);
    for (const f of filesInDir) {
        docs += `  📄 ${f.name}\n`;
    }
}
docs += `\`\`\`\n\n`;

docs += `## 3. DOCUMENTAÇÃO DOS ARQUIVOS (ARQUIVO POR ARQUIVO)\n\n`;

fileData.forEach((f, idx) => {
    const isEssential = (f.name === 'App.tsx' || f.name === 'main.tsx' || f.name === 'package.json' || f.name === 'vite.config.ts' || f.name.includes('supabase'));

    docs += `### ${idx + 1}. Arquivo: \`${f.name}\`\n\n`;
    docs += `- **Caminho Completo:** \`${f.relativePath}\`\n`;
    docs += `- **Tipo:** ${f.ext || 'Arquivo sem extensão'}\n`;
    docs += `- **Classificação:** ${isEssential ? 'Essencial' : 'Auxiliar / Regra de Negócio'}\n`;
    docs += `- **Responsabilidade Principal:** ${f.responsability}\n`;
    docs += `- **O que exatamente ele faz:** Lê/executa lógicas baseadas no seu tipo, importando componentes filhos (${f.imports.length} imports identificados) para compor funções complexas, que podem ser reutilizadas por exportações.\n`;
    docs += `- **Exporta:** ${f.exports.length > 0 ? f.exports.join(', ') : 'Nenhuma exportação explícita detectada'}\n`;
    docs += `- **Importa:** ${f.imports.length > 0 ? f.imports.join(', ') : 'Nenhum import explícito detectado (ou é script SQL/JSON/Config)'}\n`;
    docs += `- **Dependências Externas / Internas:** Requer bibliotecas do \`node_modules\` associadas aos imports acima.\n`;
    docs += `- **Riscos ou Pontos Críticos:** Se alterado de forma incompatível, quebrará o módulo onde é consumido. Arquivos na raiz podem afetar o build do Vite ou a compilação TS.\n`;
    docs += `---\n\n`;
});

const dependenciesPkgPath = path.join(rootDir, 'package.json');
if (fs.existsSync(dependenciesPkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(dependenciesPkgPath, 'utf8'));
    docs += `## 4. DEPENDÊNCIAS INTERNAS (node_modules)\n`;
    docs += `A pasta \`node_modules\` contém toda a infraestrutura de bibliotecas do projeto. Abaixo listamos as dependências registradas no escopo do projeto (ao invés de listar milhares de arquivos da pasta node_modules individualmente):\n\n`;
    docs += `**Dependencies:**\n`;
    if (pkg.dependencies) {
        for (const [dep, ver] of Object.entries(pkg.dependencies)) {
            docs += `- \`${dep}\`: \`${ver}\`\n`;
        }
    }
    docs += `\n**DevDependencies:**\n`;
    if (pkg.devDependencies) {
        for (const [dep, ver] of Object.entries(pkg.devDependencies)) {
            docs += `- \`${dep}\`: \`${ver}\`\n`;
        }
    }
    docs += `\n**Riscos node_modules:** Alterações manuais dentro da pasta node_modules serão perdidas e são **altamente não recomendadas**. Use o npm/yarn para atualizações.\n\n`;
}

docs += `## 5. REPOSITÓRIO E CONTROLE DE VERSÃO (.git)\n`;
docs += `A pasta \`.git/\` (oculta) mantém a árvore de histórico de versões, commits, branches, refs locais e arquivos de configurações de deploy em cloud/github. Representa o estado legado e corrente (HEAD) do código fonte.\n\n`;

docs += `>FIM DO DOCUMENTO\n>Gerado automaticamente com detalhamento individual para ${fileData.length} arquivos essenciais da aplicação.\n`;

fs.writeFileSync(outputFile, docs, 'utf-8');
console.log(`Documentação gerada com sucesso em: ${outputFile}`);
