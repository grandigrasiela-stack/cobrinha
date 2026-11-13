# Serpentis — Jogo da Cobrinha

Aplicação web moderna do clássico jogo Snake, desenvolvida com **HTML, CSS (Tailwind CSS), TypeScript e React (Vite)**, pronta para hospedagem estática no **Vercel** e versionamento no **GitHub**.

## Funcionalidades

- **6 níveis progressivos**: velocidade crescente, obstáculos adicionados gradualmente em posições seguras e metas claras de pontuação para avançar.
- **Identificação do jogador**: inserção do nome antes do início da partida, com memorização automática para rodadas seguintes.
- **Ranking persistente no navegador**: as pontuações são salvas em `localStorage`, mantendo o Top 10 mesmo após recarregar a página, sem depender de servidor.
- **Controles completos**:
  - **Teclado**: Setas direcionais ou `W`, `A`, `S`, `D` para mover; `Espaço` ou `P` para pausar.
  - **Telas de toque**: gestos de deslize (swipe) diretamente sobre o tabuleiro e botões direcionais na tela.
- **Efeitos sonoros sintetizados**: áudio leve via Web Audio API nativa do navegador (com botão de silenciar), sem necessidade de arquivos externos.

## Personalizando o nome do criador

Antes de publicar, abra o arquivo `src/config/gameConfig.ts` e altere a constante `CREATOR_NAME`:

```ts
export const CREATOR_NAME = 'Seu Nome Real';
```

Esse valor aparece automaticamente na tela inicial e no rodapé do jogo.

## Estrutura do projeto

```text
├── index.html                    # Documento HTML principal e fontes
├── package.json                  # Scripts e dependências do projeto
├── vercel.json                   # Configuração de build estático para o Vercel
├── vite.config.ts                # Configuração do Vite + Tailwind
└── src/
    ├── App.tsx                   # Estado principal, loop do jogo e layout
    ├── index.css                 # Estilos globais e configuração de fontes
    ├── main.tsx                  # Ponto de entrada React
    ├── config/
    │   └── gameConfig.ts         # Definição dos 6 níveis, grade e crédito
    ├── types/
    │   └── game.ts               # Tipos TypeScript do jogo e ranking
    ├── utils/
    │   ├── audio.ts              # Sintetizador de som com Web Audio API
    │   └── storage.ts            # Leitura e gravação no localStorage
    └── components/
        ├── LevelsPanel.tsx       # Lista de progressão dos níveis
        ├── RankingPanel.tsx      # Tabela de melhores pontuações
        ├── SnakeCanvas.tsx       # Renderização Canvas HiDPI, swipe e telas
        └── TouchControls.tsx     # Controles direcionais na tela
```

## Como executar localmente

1. Certifique-se de ter o **Node.js** (versão 18 ou superior) instalado.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:3000` no navegador.

Para gerar a versão estática de produção na pasta `dist/`:

```bash
npm run build
```

## Como publicar no GitHub e no Vercel

1. **Subir para o GitHub**:
   - Crie um repositório vazio no GitHub.
   - No terminal, dentro da pasta do projeto:
     ```bash
     git init
     git add .
     git commit -m "Versão inicial do jogo Serpentis"
     git branch -M main
     git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
     git push -u origin main
     ```
2. **Conectar ao Vercel**:
   - Acesse [vercel.com](https://vercel.com) e faça login com sua conta do GitHub.
   - Clique em **Add New → Project** e selecione o repositório criado.
   - O Vercel detectará automaticamente o **Vite** (`Build Command: npm run build`, `Output Directory: dist`).
   - Clique em **Deploy** e aguarde alguns segundos para receber o link público do jogo.
