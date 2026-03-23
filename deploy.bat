@echo off
chcp 65001 >nul
title Deploy to GitHub

REM ========================================
REM   DEPLOY AUTOMÁTICO A GITHUB
REM   Doble clic para ejecutar
REM ========================================

echo.
echo ============================================
echo   🚀 DEPLOY AUTOMÁTICO A GITHUB
echo ============================================
echo.

REM Ir al directorio del script (raíz del repo)
cd /d "%~dp0"

REM 1. Verificar que estamos en un repo git
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ❌ ERROR: No se encontró un repositorio git.
    echo    Asegúrate de que este archivo está en la raíz del repo.
    pause
    exit /b 1
)

REM 2. Mostrar estado actual
echo 📋 Estado actual del repositorio:
echo.
git status -s
echo.

REM 3. Verificar si hay cambios
git diff --quiet --exit-code 2>nul
set DIFF_RESULT=%errorlevel%
git diff --quiet --cached --exit-code 2>nul
set CACHED_RESULT=%errorlevel%

REM Chequear archivos sin trackear
for /f %%i in ('git ls-files --others --exclude-standard') do set UNTRACKED=1

if %DIFF_RESULT%==0 if %CACHED_RESULT%==0 if not defined UNTRACKED (
    echo ✅ No hay cambios para subir. Todo está actualizado.
    echo.
    pause
    exit /b 0
)

REM 4. Agregar todos los cambios
echo 📦 Agregando todos los archivos...
git add -A
if errorlevel 1 (
    echo ❌ ERROR al agregar archivos.
    pause
    exit /b 1
)
echo    ✅ Archivos agregados.
echo.

REM 5. Crear commit con fecha y hora
for /f "tokens=1-3 delims=/" %%a in ('date /t') do set FECHA=%%c-%%b-%%a
for /f "tokens=1-2 delims=: " %%a in ('time /t') do set HORA=%%a:%%b

set MENSAJE=auto-deploy: %FECHA% %HORA%

echo 💾 Creando commit: "%MENSAJE%"
git commit -m "%MENSAJE%"
if errorlevel 1 (
    echo ❌ ERROR al crear commit.
    pause
    exit /b 1
)
echo    ✅ Commit creado.
echo.

REM 6. Push a GitHub
echo 🌐 Subiendo a GitHub (origin/main)...
git push origin main
if errorlevel 1 (
    echo.
    echo ❌ ERROR al hacer push. Posibles causas:
    echo    - Sin conexión a internet
    echo    - Credenciales de GitHub expiradas
    echo    - Conflictos con el remoto
    pause
    exit /b 1
)

echo.
echo ============================================
echo   ✅ DEPLOY COMPLETADO EXITOSAMENTE!
echo ============================================
echo.
echo Los cambios están ahora en GitHub.
echo.
pause
