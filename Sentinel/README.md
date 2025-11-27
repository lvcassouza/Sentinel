# Sentinel Auth API

API de autenticação e gerenciamento de sessões construída com Node.js, Express e PostgreSQL. Implementa login com JWT, rotação segura de refresh tokens, documentação via Swagger e testes (unitários e de integração).

## Sumário
- Visão Geral
- Recursos
- Stack Tecnológica
- Arquitetura
- Variáveis de Ambiente
- Pré-requisitos
- Instalação e Configuração
- Execução
- Scripts
- Endpoints
- Testes
- Estrutura de Pastas
- Segurança
- Documentação
- Publicação
- Contribuição
- Licença

## Visão Geral
Sentinel é uma API focada em autenticação:
- Registro de usuários com senhas protegidas por `bcrypt`.
- Emissão de `access token` (JWT) com expiração curta.
- Emissão e rotação de `refresh tokens` armazenados como hash no banco.
- Proteção de rotas com middleware JWT.
- Documentação pronta em `Swagger UI`.

## Recursos
- Registro de usuário: `POST /auth/register`.
- Login com JWT + Refresh Token: `POST /auth/login`.
- Rotação/renovação de token: `POST /auth/refresh`.
- Perfil do usuário autenticado: `GET /user/profile`.
- Documentação interativa: `GET /docs`.

## Stack Tecnológica
- Runtime: Node.js
- Framework: Express
- Banco: PostgreSQL (`pg`)
- Autenticação: `jsonwebtoken` (JWT), `bcryptjs` para senhas, `crypto` para refresh tokens
- Configuração: `dotenv`
- Documentação: `swagger-ui-express`
- Testes: `jest`, `supertest`

## Arquitetura
- `server.js` inicializa Express, registra rotas e Swagger e sobe o servidor.
- `config/db.js` cria `Pool` do Postgres e migrações mínimas (tabelas `users` e `refresh_tokens`).
- `routes/*` definem endpoints públicos.
- `controllers/*` contêm a lógica de negócio (registro, login, refresh, perfil).
- `middlewares/authMiddleware.js` valida JWT e popula `req.userId`.
- `models/*` executam queries no Postgres.

## Variáveis de Ambiente
- `PORT`: porta do servidor HTTP (padrão `3000`).
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`: configuração do PostgreSQL.
- `JWT_SECRET`: segredo criptográfico para assinar/verificar JWT.
Observação: `.env` NÃO deve ser versionado. Um exemplo é fornecido em `.env.example`.

## Pré-requisitos
- Node.js 18+
- PostgreSQL 16 (local ou via Docker)
- `npm` ou `yarn`

## Instalação e Configuração
1. Clonar o repositório e instalar dependências:
   ```bash
   npm install
   ```
2. Criar o arquivo `.env` na raiz com base em `.env.example`:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_DATABASE=auth_db
   JWT_SECRET=changeme_super_secret
   ```
3. (Opcional) Subir Postgres via Docker Compose:
   ```bash
   docker-compose up -d postgres
   ```

## Execução
- Ambiente local (sem Docker):
  ```bash
  npm start
  ```
  A API iniciará em `http://localhost:3000` (ou porta configurada em `PORT`). Ao iniciar, a aplicação cria as tabelas necessárias caso não existam.

- Com Docker (banco):
  ```bash
  docker-compose up -d postgres
  npm start
  ```
  Para testes de integração, há um serviço `postgres_test` exposto em `5433`.

## Scripts
- `npm start`: inicia a API (`server.js`).
- `npm test`: executa testes unitários com `NODE_ENV=test`.
- `npm run test:integration`: executa o teste de integração real com Postgres (usa `postgres_test` na porta `5433`).

## Endpoints
- `POST /auth/register`
  - Body: `{ name, email, password }`
  - Respostas: `201 { user }`, `400 Dados inválidos`, `409 Email já registrado`
  - Exemplo:
    ```bash
    curl -X POST http://localhost:3000/auth/register \
      -H 'Content-Type: application/json' \
      -d '{"name":"Alice","email":"alice@example.com","password":"Secret#123"}'
    ```

- `POST /auth/login`
  - Body: `{ email, password }`
  - Respostas: `200 { token, refreshToken }`, `400`, `401`
  - Exemplo:
    ```bash
    curl -X POST http://localhost:3000/auth/login \
      -H 'Content-Type: application/json' \
      -d '{"email":"alice@example.com","password":"Secret#123"}'
    ```

- `POST /auth/refresh`
  - Body: `{ refreshToken }`
  - Respostas: `200 { token, refreshToken }`, `400`, `401 inválido/expirado/revogado`
  - Exemplo:
    ```bash
    curl -X POST http://localhost:3000/auth/refresh \
      -H 'Content-Type: application/json' \
      -d '{"refreshToken":"<valor recebido no login>"}'
    ```

- `GET /user/profile`
  - Header: `Authorization: Bearer <token>`
  - Respostas: `200 { user }`, `401`, `404`
  - Exemplo:
    ```bash
    curl http://localhost:3000/user/profile \
      -H 'Authorization: Bearer <access_token>'
    ```

### Formato de erro
- As respostas de erro seguem `{ "error": "mensagem" }` com códigos HTTP adequados.

## Testes
- Unitários e de integração já inclusos em `tests/`.
- Rodar unitários:
  ```bash
  npm test
  ```
- Rodar integração (Postgres real na porta `5433`):
  ```bash
  docker-compose up -d postgres_test
  npm run test:integration
  ```

## Estrutura de Pastas
```
├── config/
│   ├── db.js           # Pool Postgres e migrações mínimas
│   └── swagger.js      # Especificação OpenAPI
├── controllers/
│   ├── authController.js
│   └── userController.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   ├── tokenModel.js
│   └── userModel.js
├── routes/
│   ├── authRoutes.js
│   └── userRoutes.js
├── tests/
│   ├── integration/
│   │   └── auth.integration.test.js
│   ├── auth.test.js
│   └── refresh.test.js
├── .env.example
├── .gitignore
├── docker-compose.yml
├── jest.config.js
├── package-lock.json
├── package.json
└── server.js
```

## Segurança
- Senhas armazenadas com `bcrypt` (hash + salt).
- `access tokens` JWT com payload mínimo (`sub`) e expiração curta.
- `refresh tokens` gerados aleatoriamente e guardados como hash (`sha256`) em banco.
- Rotação de refresh: ao usar `/auth/refresh`, o token anterior é revogado e um novo é emitido.
- Middleware de autenticação valida `Authorization: Bearer <token>` e popula `req.userId`.

## Documentação
- Swagger UI disponível em `GET /docs`.
- Servidor padrão: `http://localhost:${PORT || 3000}` conforme `.env`.
 - Para testar no Swagger:
   - Acesse `http://localhost:3000/docs`.
   - Use o botão "Authorize" e informe `Bearer <token>` (obtido em `/auth/login`).

## Licença
Nenhuma licença explícita definida neste repositório. Adicione uma licença (por exemplo, MIT) conforme necessidade do projeto.
## Publicação
- Garanta que `.env` esteja fora do controle de versão (há `.gitignore`).
- Configure variáveis de ambiente seguras no provedor (ex.: Render, Railway, Heroku, Docker Swarm/Kubernetes).
- Habilite HTTPS, defina `JWT_SECRET` forte e rotacione segredos periodicamente.
- Opcional: aplique rate limiting, CORS conforme necessidade, e monitoramento de logs sem dados sensíveis.
- Antes do push público, rode um scanner de segredos (ex.: `gitleaks`, `trufflehog`).

## Contribuição
- Faça fork, crie uma branch (`feat/…` ou `fix/…`), e abra PR com descrição clara.
- Mantenha cobertura de testes; execute `npm test` e, se aplicável, `npm run test:integration`.
- Siga o padrão de código existente e evite incluir dados sensíveis em commits.