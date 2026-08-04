# Backend NestJS — OmniMedia SaaS

API REST completa para controle de navegadores anti-detect, agendamento de publicações, edição de mídias e integração com redes sociais.

## Stack
- **NestJS** (Clean Architecture / SOLID / Repository Pattern)
- **Puppeteer Stealth** (Navegadores isolados por proxy)
- **BullMQ + Redis** (Fila de publicações)
- **PostgreSQL** (Banco de dados)
- **Winston Logger** (Logs estruturados)
- **Swagger/OpenAPI** (Documentação automática)
- **JWT + Refresh Token** (Autenticação)

## Instalação

```bash
cd backend
npm install
npm run start:dev
```

## Variáveis de Ambiente (.env)
```env
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/omnimedia
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=sua_chave_jwt_super_segura
S3_BUCKET=omnimedia-media
S3_ENDPOINT=https://s3.amazonaws.com
AWS_ACCESS_KEY=sua_chave
AWS_SECRET_KEY=sua_chave_secreta
```
