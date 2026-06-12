# Cronos — Extensão de Rastreamento de Tempo (em desenvolvimento)

Extensão para Chrome que rastreia o tempo gasto em cada domínio navegado, semelhante ao WakaTime. Os dados são enviados para uma API backend e exibidos em um popup com tema Terminal.

<img width="498" height="551" alt="image" src="https://github.com/user-attachments/assets/e5e9c70f-9775-4601-ba1d-c8e3c699cad9" />

---


## Tecnologias

| Camada | Tecnologia |
|---|---|
| Framework de extensão | [WXT](https://wxt.dev) 0.19 |
| UI | React 18 |
| Estilos | Tailwind CSS v4 + shadcn/ui (tema Terminal) |
| Linguagem | TypeScript |
| Fonte | IBM Plex Mono |
| Build | Vite 6 |

---

## Estrutura do projeto

```
cronos-web-ex/
├── entrypoints/
│   ├── background.ts          # Service worker — captura e envia os dados
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx            # UI do popup
│   │   └── style.css
│   └── options/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx            # Página de configurações
│       └── style.css
├── components/
│   ├── ui/                    # Componentes base shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── label.tsx
│   │   └── separator.tsx
│   ├── DomainRow.tsx          # Linha de domínio com barra de progresso
│   ├── DomainList.tsx         # Lista de domínios
│   ├── Header.tsx             # Cabeçalho com logo
│   └── StatusBadge.tsx        # Indicador de sincronização
├── hooks/
│   ├── useTrackerData.ts      # Lê domainSeconds e heartbeatQueue do storage
│   └── useConfig.ts           # Lê e salva configurações (userId, apiUrl, token)
├── lib/
│   ├── format.ts              # Formata segundos em "2h 30m", "5m 10s"
│   └── utils.ts               # Utilitário cn() para classes Tailwind
├── styles/
│   └── theme.css              # Variáveis do tema Terminal (oklch)
├── wxt.config.ts
├── tsconfig.json
└── package.json
```

---

## Como funciona o rastreamento

### Captura (background.ts)

O service worker escuta eventos de navegação do Chrome:

- **Troca de aba** → `chrome.tabs.onActivated`
- **Navegação na mesma aba** → `chrome.tabs.onUpdated`
- **Inicialização** → `chrome.tabs.query` detecta a aba já aberta

A cada evento, extrai o domínio da URL (`https://github.com/...` → `github.com`) e decide se grava um **heartbeat**:

```
domínio mudou? → grava heartbeat imediatamente
mesmo domínio há 30s? → grava heartbeat
usuário ocioso (sem teclado/mouse por 60s)? → ignora
página do sistema (chrome://, about:)? → ignora
```

### Armazenamento (chrome.storage.local)

Dois valores são mantidos localmente:

```json
{
  "heartbeatQueue": [
    { "url": "github.com", "timestamp": "2026-06-11T14:30:00.000Z" },
    { "url": "youtube.com", "timestamp": "2026-06-11T14:31:00.000Z" }
  ],
  "domainSeconds": {
    "github.com": 90,
    "youtube.com": 30
  }
}
```

- `heartbeatQueue` — fila de eventos aguardando envio para a API
- `domainSeconds` — tempo acumulado por domínio (exibido no popup)

### Envio para a API

Um alarme dispara a cada **1 minuto** e envia a fila para o backend:

```http
POST /api/time-spent
Content-Type: application/json
Authorization: Bearer <token>

{
  "user_id": "019e66f9-...",
  "user_time_spent": [
    { "url": "github.com",  "timestamp": "2026-06-11T14:30:00Z" },
    { "url": "youtube.com", "timestamp": "2026-06-11T14:31:00Z" }
  ]
}
```

Após confirmação `200` da API, apenas os itens enviados são removidos da fila. Se houver falha de rede, os dados ficam guardados para a próxima tentativa.

---

## Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- npm v9 ou superior
- Google Chrome

---

## Rodando localmente

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repositorio>
cd cronos-web-ex
npm install
```

### 2. Build de desenvolvimento (com hot reload)

```bash
npm run dev
```

O WXT fica observando alterações e reconstrói automaticamente em `.output/chrome-mv3/`.

### 3. Carregar a extensão no Chrome

1. Abra `chrome://extensions`
2. Ative **"Modo do desenvolvedor"** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `.output/chrome-mv3/`

### 4. Configurar a extensão

1. Clique com o botão direito no ícone da extensão → **"Opções"**
2. Preencha:
   - **ID do Usuário** — identificador do colaborador no sistema
   - **URL da API** — endereço do backend (ex: `http://127.0.0.1:8000/api/time-spent`)
   - **Token Bearer** — opcional, para autenticação
3. Clique em **Salvar**

---

## Scripts disponíveis

```bash
npm run dev       # Build em modo watch com hot reload
npm run build     # Build de produção em .output/chrome-mv3/
npm run zip       # Gera .zip pronto para publicação na Chrome Web Store
npm run typecheck # Verifica erros de TypeScript sem buildar
```

---

## Formato do payload enviado à API

```typescript
{
  user_id: string,           // UUID do colaborador
  user_time_spent: Array<{
    url: string,             // domínio sem protocolo (ex: "github.com")
    timestamp: string        // ISO 8601 (ex: "2026-06-11T14:30:00.000Z")
  }>
}
```

---

## Observações técnicas

**Service Worker MV3** — O background do Chrome pode ser encerrado após ~30 segundos sem eventos. As variáveis em memória são zeradas, mas os dados em `chrome.storage.local` são persistidos. A cada reinício, o worker detecta automaticamente a aba ativa.

**Modelo de heartbeat** — O tempo não é medido com precisão contínua. Cada heartbeat representa **30 segundos** de atividade (mesmo modelo do WakaTime). Se o usuário ficar em `github.com` por 5 minutos, serão registrados ~10 heartbeats = ~300 segundos.

**Idle detection** — Se o usuário ficar 60 segundos sem mover o mouse ou digitar, o rastreamento é pausado automaticamente.
