# Frontend do Ponto Digital

Aplicação React + Vite para o registro diário de jornada. A interface consome a API Fastify em `../api` e não replica regras de cálculo de horas.

## Desenvolvimento

```bash
npm install
copy .env.example .env
npm run dev
```

Defina `VITE_API_URL` com a URL da API, incluindo o prefixo `/api`.

## Organização

- `src/app/`: roteador, providers e proteção de rotas.
- `src/components/`: componentes de layout, estados compartilhados e primitives shadcn/ui.
- `src/features/`: componentes específicos de autenticação e registro de ponto.
- `src/services/`: cliente de cada domínio da API.
- `src/pages/`: uma página por rota do produto.
- `src/lib/`: Axios, formatadores e utilitários.
