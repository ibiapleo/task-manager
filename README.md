# Task Manager

Aplicação web para organizar tarefas no dia a dia: o usuário autentica, mantém um perfil com preferências e trabalha em um board (lista ou kanban) com status, prioridade, prazo e anexos. Contas comuns veem e alteram apenas o próprio trabalho; administradores têm visão da plataforma — inclusive listar tarefas de todos e gerenciar papéis.

Conceitualmente, o sistema separa três responsabilidades: **identidade e mídia** (quem é o usuário e onde ficam arquivos), **domínio de negócio** (tarefas, papéis, preferências de produto) e **experiência** (board, filtros, ajustes). A identidade e o armazenamento de arquivos ficam no Supabase; as regras de quem pode ver ou editar o quê ficam numa API própria; a interface consome as duas de forma coordenada.

## Arquitetura

```
apps/client/              # Next.js — UI e ciclo de autenticação
apps/api/                 # NestJS — regras de negócio e persistência de domínio
packages/shared-types/    # Contratos TypeScript/Zod compartilhados
```

Yarn workspaces unem os pacotes. O Postgres do projeto Supabase é a fonte de verdade das tabelas de domínio (`profiles`, `tasks`, anexos metadados); Auth e Storage são serviços gerenciados do mesmo ecossistema.

## Decisões técnicas

### Por que Supabase Auth (e não login na Nest)

Autenticação é um problema resolvido: cadastro, sessão, refresh de token e logout têm requisitos de segurança altos e pouco valor diferencial neste desafio. O client usa o SDK do Supabase para todo o ciclo de auth e envia apenas o **access token** (Bearer) para a API. A Nest atua como *resource server*: valida o JWT via JWKS do projeto, resolve o `Profile` correspondente e aplica autorização. Assim a API não armazena senhas nem implementa fluxos de sessão.

### Por que Postgres no Supabase + Prisma

O domínio (perfil, papéis, tarefas, vínculos de anexos) precisa de modelo relacional e queries previsíveis. Usar o Postgres já acoplado ao Auth evita um segundo banco só para o app e permite que `Profile.id` seja o mesmo UUID de `auth.users`. O Prisma descreve o schema, gera o client tipado e isola o SQL do restante da Nest — útil com connection pooling (URL pooled em runtime vs. URL direta quando for necessário ferramenta de migração).

As migrations do repositório já estão aplicadas no banco serverless usado pelo projeto; quem for só subir a aplicação localmente **não precisa** rodar `migrate` de novo.

### Por que Supabase Storage

Avatares e anexos de tarefa são blobs. Guardá-los na API (disco ou base64 no Postgres) complicaria deploy, limites de payload e CDN. O Storage cobre upload/download com URL; a API e o client tratam **metadados e autorização de domínio** (quem pode associar um arquivo a qual tarefa), não o servidor de arquivos em si.

### Por que NestJS na API

O desafio pede domínio com papéis, ownership e filtros — um lugar natural para DTOs validados, módulos por contexto (`auth`, `users`, `tasks`), guards e documentação OpenAPI. A Nest entrega essa estrutura sem reinventar o servidor HTTP. Regras sensíveis (ex.: `scope=all` só para `ADMIN`, ownership em update/delete) ficam no servidor; a UI só reflete permissões.

### Por que Next.js + TanStack Query no client

App Router e client components cobrem as telas autenticadas (board, ajustes, usuários). O TanStack Query padroniza cache de perfil/tarefas, evita waterfall simples de `fetch` e facilita limpar estado no logout — importante para não “vazar” dados de uma conta para outra na mesma aba. Preferências (tema, contraste, formato de data) vivem no Profile e influenciam a UI; o client pode pré-visualizar alterações antes de persistir.

### Por que shared-types e monorepo

Filtros, preferências e shapes de resposta precisam bater entre client e API. Um pacote `@task-manager/shared-types` evita duplicar enums e DTOs em dois lugares. O monorepo mantém isso versionado junto com as apps.

### Papéis e escopo

- `COMMON`: só as próprias tarefas.
- `ADMIN`: pode listar todas (`GET /tasks?scope=all`), editar/excluir qualquer tarefa e alterar roles.
- `scope` omisso ou `personal` sempre restringe ao usuário autenticado — inclusive para admin na aba “Minhas Tarefas”. A aba global no client é conveniência; a proteção real é o backend.

## Como rodar (desenvolvimento local)

Pré-requisitos: Node.js ≥ 20 e Yarn 1.x. O projeto Supabase (Auth, Postgres e Storage) deve estar acessível com as migrations já aplicadas.

```bash
cp .env.example .env
cp apps/client/.env.example apps/client/.env
```

Preencha as variáveis apontando para o seu projeto Supabase e para a API local (`NEXT_PUBLIC_API_URL`, `API_PORT`, `CLIENT_PORT`, `FRONTEND_URL`, etc.). Os arquivos `.env.example` documentam cada chave.

```bash
yarn install
yarn:dev
```

- Client: [http://localhost:3000](http://localhost:3000)  
- API: [http://localhost:3001](http://localhost:3001)  
- Swagger: [http://localhost:3001/docs](http://localhost:3001/docs)

### Contas de teste


| Papel  | E-mail            | Senha          |
| ------ | ----------------- | -------------- |
| COMMON | `common@test.com` | `password@123` |
| ADMIN  | `admin@test.com`  | `password@123` |


## Docker

Ambiente local production-like (API Nest + client Next standalone). Postgres/Auth continuam no Supabase remoto via variáveis do `.env` na raiz.

```bash
cp .env.example .env

docker compose up --build -d
```

| Serviço | Container | URL |
| ------- | --------- | --- |
| Client | `task-manager-client` | [http://localhost:3000](http://localhost:3000) |
| API | `task-manager-api` | [http://localhost:3001](http://localhost:3001) |
| Swagger | `task-manager-api` | [http://localhost:3001/docs](http://localhost:3001/docs) |

`NEXT_PUBLIC_API_URL` deve apontar para `http://localhost:${API_PORT}` (porta publicada no host), não para o hostname interno do Compose.

Rebuilds reutilizam cache BuildKit do Yarn e do Next (`.next/cache`); a primeira build continua mais lenta, as seguintes bem mais rápidas se `package.json` / lockfile não mudarem.

Para desenvolvimento com hot-reload, use o fluxo `yarn:dev` acima.

## Uso de IA

Usei o Cursor de ponta a ponta, de forma deliberada e em ciclos curtos — não como “gerar o projeto de uma vez”.

1. **Planejamento.** No modo Plan, mando um prompt com as especificações técnicas do que preciso construir (escopo da feature, restrições de segurança, superfícies de API/UI). A IA devolve um plano estruturado.
2. **Validação.** Eu leio o plano, corto o que está fora de escopo, corrijo premissas erradas e refin o desenho até ele refletir o que eu quero.
3. **Implementação.** Só então peço para construir, seguindo o plano aprovado.
4. **Review.** No modo Review, releio o código gerado: faz sentido com a arquitetura? vazou regra de negócio para o client? há atalho perigoso ou inconsistência de tipos? Ajusto ou peço correção quando algo não passa nessa revisão.

A IA acelera exploração, rascunho e implementações repetitivas. As decisões de produto/arquitetura, o aceite do plano e a responsabilidade pelo que entra no repositório são minhas.

## Vídeo

O vídeo de apresentação (máx. 7 minutos) será gravado e o link incluído aqui antes da entrega final.

## Observações

- A divisão auth (Supabase) / domínio (Nest) / UI (Next) é intencional: cada camada tem um motivo claro de existir.
- Regras de papel e ownership foram pensadas para não depender de “esconder botão” no frontend.
- A documentação de Docker descreve o fluxo `docker compose up --build -d` com containers `task-manager-api` e `task-manager-client`; o vídeo de apresentação ainda evolui.

