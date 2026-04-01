@echo off
chcp 65001 >nul
title Deploy to GitHub

REM ========================================
REM   DEPLOY AUTOMATICO A GITHUB
REM   Doble clic para ejecutar
REM ========================================

echo.
echo ============================================
echo   DEPLOY AUTOMATICO A GITHUB
echo ============================================
echo.

REM Ir al directorio del script (raiz del repo)
cd /d "%~dp0"

REM 1. Verificar que estamos en un repo git
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: No se encontro un repositorio git.
    echo    Asegurate de que este archivo esta en la raiz del repo.
    pause
    exit /b 1
)

REM 2. Mostrar estado actual
echo Estado actual del repositorio:
echo.
git status -s
echo.

REM 3. Verificar si hay cambios
set UNTRACKED=0
for /f %%i in ('git ls-files --others --exclude-standard 2^>nul') do set UNTRACKED=1

git diff --quiet --exit-code >nul 2>&1
set DIFF_RESULT=%errorlevel%

git diff --quiet --cached --exit-code >nul 2>&1
set CACHED_RESULT=%errorlevel%

if "%DIFF_RESULT%"=="0" if "%CACHED_RESULT%"=="0" if "%UNTRACKED%"=="0" (
    echo No hay cambios para subir. Todo esta actualizado.
    echo.
    pause
    exit /b 0
)

REM 4. Agregar todos los cambios
echo Agregando todos los archivos...
git add -A
if errorlevel 1 (
    echo ERROR al agregar archivos.
    pause
    exit /b 1
)
echo    OK - Archivos agregados.
echo.

REM 5. Crear commit con fecha y hora via WMIC (robusto en cualquier idioma de Windows)
for /f "skip=1 tokens=1-2 delims=T" %%a in ('wmic os get LocalDateTime /value 2^>nul ^| find "="') do (
    for /f "tokens=2 delims==" %%x in ("%%a=%%b") do set RAWDT=%%x
)
REM Fallback si WMIC no devuelve nada
if not defined RAWDT (
    set RAWDT=20260101000000
)
set FECHA=%RAWDT:~0,4%-%RAWDT:~4,2%-%RAWDT:~6,2%
set HORA=%RAWDT:~8,2%:%RAWDT:~10,2%

set MENSAJE=auto-deploy: %FECHA% %HORA%

echo Creando commit: "%MENSAJE%"
git commit -m "%MENSAJE%"
if errorlevel 1 (
    echo ERROR al crear commit.
    pause
    exit /b 1
)
echo    OK - Commit creado.
echo.

REM 6. Pull rebase para evitar conflictos con el remoto
echo Sincronizando con GitHub...
git pull --rebase origin main >nul 2>&1
REM (No abortamos si falla el pull, puede que sea rama nueva)

REM 7. Push a GitHub
echo Subiendo a GitHub (origin/main)...
git push origin main
if errorlevel 1 (
    echo.
    echo ERROR al hacer push. Posibles causas:
    echo    - Sin conexion a internet
    echo    - Credenciales de GitHub expiradas
    echo    - Conflictos con el remoto (ejecuta: git pull --rebase origin main)
    pause
    exit /b 1
)

echo.
echo ============================================
echo   DEPLOY COMPLETADO EXITOSAMENTE
echo ============================================
echo.
echo Los cambios estan ahora en GitHub.
echo.
pause
