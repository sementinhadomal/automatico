@echo off
echo ===================================================
echo   🚀 Iniciando Plataforma OmniMedia SaaS Privada
echo ===================================================
echo.

echo 1/2. Iniciando Frontend Next.js na porta 3000...
start cmd /k "npm run dev"

echo 2/2. Iniciando Backend NestJS na porta 3001...
start cmd /k "cd backend && npm run start:dev"

echo.
echo ===================================================
echo   ✅ Tudo pronto! Acesse no navegador:
echo   💻 Frontend: http://localhost:3000
echo   📚 API Swagger: http://localhost:3001/api/docs
echo ===================================================
pause
