# Cronos — Extensão de Rastreamento de Tempo (em desenvolvimento)

Extensão para Chrome que rastreia o tempo gasto em cada domínio navegado, semelhante ao WakaTime. Os dados ficam armazenados localmente no navegador e são exibidos em um popup com tema Terminal.

> **v1** — rastreamento local apenas. Envio para API planejado para v2.

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
│   ├── background.ts        # Service worker — captura e armazena os dados
│   └── popup/
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx          # UI do popup
│       └── style.css
├── components/
│   ├── ui/                  # Componentes base shadcn/ui
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── label.tsx
│   │   └── separator.tsx
│   ├── DomainRow.tsx        # Linha de domínio com barra de progresso
│   ├── DomainList.tsx       # Lista de domínios
│   ├── Header.tsx           # Cabeçalho com logo
│   └── StatusBadge.tsx      # Indicador de modo (local)
├── hooks/
│   └── useTrackerData.ts    # Lê domainSeconds do storage e expõe para o popup
├── lib/
│   ├── format.ts            # Formata segundos em "2h 30m", "5m 10s"
│   └── utils.ts             # Utilitário cn() para classes Tailwind
├── styles/
│   └── theme.css            # Variáveis do tema Terminal (oklch)
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
- **Alarme a cada 1 min** → acumula tempo mesmo sem trocar de aba

A cada evento, extrai o domínio da URL (`https://github.com/...` → `github.com`) e decide se registra um **heartbeat**:

```
domínio mudou?                   → registra heartbeat imediatamente
mesmo domínio há 30s?            → registra heartbeat
usuário ocioso (60s sem input)?  → ignora
página do sistema (chrome://)?   → ignora
```

Cada heartbeat vale **30 segundos** acumulados no domínio.

### Armazenamento (chrome.storage.local)

Um único objeto é mantido localmente:

```json
{
  "domainSeconds": {
    "github.com":  90,
    "youtube.com": 30,
    "notion.so":   120
  }
}
```

Os dados **persistem** mesmo quando o service worker é encerrado pelo Chrome. O popup lê diretamente esse objeto e se atualiza em tempo real via `chrome.storage.onChanged`.

---

## Pré-requisitos

- [Node.js](https://nodejs.org) v18 ou superior
- npm v9 ou superior
- Google Chrome

---

## Rodando localmente

### 1. Instalar dependências

```bash
git clone <url-do-repositorio>
cd cronos-web-ex
npm install
```

### 2. Build de desenvolvimento (com hot reload)

```bash
npm run dev
```

O WXT observa alterações e reconstrói automaticamente em `.output/chrome-mv3/`.

### 3. Carregar no Chrome

1. Abra `chrome://extensions`
2. Ative **"Modo do desenvolvedor"** (canto superior direito)
3. Clique em **"Carregar sem compactação"**
4. Selecione a pasta `.output/chrome-mv3/`
5. Navegue para qualquer site — os dados aparecem no popup após ~30 segundos

> Após cada `npm run build`, clique no ícone de **recarregar** da extensão em `chrome://extensions`.

---

## Scripts disponíveis

```bash
npm run dev       # Build em modo watch com hot reload
npm run build     # Build de produção em .output/chrome-mv3/
npm run zip       # Gera .zip para publicação na Chrome Web Store
npm run typecheck # Verifica erros de TypeScript sem buildar
```

---

## Roadmap

### v1 (atual)
- [x] Rastreamento de tempo por domínio
- [x] Detecção de ociosidade
- [x] Popup com lista de domínios e tempo acumulado
- [x] Persistência local com `chrome.storage`

### v2 (planejado)
- [ ] Login via web app — `userId` dinâmico por colaborador
- [ ] Envio dos dados para API (`POST /api/time-spent`)
- [ ] Autenticação via Bearer token
- [ ] Página de configurações na extensão

---

## Observações técnicas

**Service Worker MV3** — O background pode ser encerrado após ~30s sem eventos. As variáveis em memória são zeradas, mas `chrome.storage.local` é persistido no disco. O alarme de 1 minuto garante que o worker seja reativado periodicamente para continuar acumulando tempo.

**Modelo de heartbeat** — O tempo é aproximado por pulsações de 30 segundos (mesmo modelo do WakaTime). 5 minutos em `github.com` = ~10 heartbeats = ~300 segundos registrados.

**Idle detection** — Sem interação de teclado ou mouse por 60 segundos, o rastreamento é pausado automaticamente.
