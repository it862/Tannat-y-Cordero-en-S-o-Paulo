@echo off
chcp 65001 >nul
title Iniciar - Sao Paulo Festival

echo.
echo ============================================
echo   INICIANDO LANDING PAGE LOCAL
echo   Tannat y Cordero en Sao Paulo
echo ============================================
echo.

cd /d "%~dp0"

set PORT=3000
set URL=http://localhost:%PORT%

REM --- Detectar Node.js / npx ---
where node >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js detectado. Usando npx serve...
    echo.
    echo Servidor en: %URL%
    echo Presiona Ctrl+C para detener.
    echo.
    call :abrirnavegador
    npx --yes serve . -p %PORT% -s
    goto :fin
)

REM --- Fallback: Python ---
where python >nul 2>&1
if not errorlevel 1 (
    echo [OK] Python detectado. Usando http.server...
    echo.
    echo Servidor en: %URL%
    echo Presiona Ctrl+C para detener.
    echo.
    call :abrirnavegador
    python -m http.server %PORT%
    goto :fin
)

REM --- Fallback: Python3 ---
where python3 >nul 2>&1
if not errorlevel 1 (
    echo [OK] Python3 detectado. Usando http.server...
    echo.
    echo Servidor en: %URL%
    echo Presiona Ctrl+C para detener.
    echo.
    call :abrirnavegador
    python3 -m http.server %PORT%
    goto :fin
)

REM --- Sin Node ni Python ---
echo.
echo ERROR: No se encontro Node.js ni Python.
echo.
echo Instala Node.js desde: https://nodejs.org
echo O Python desde:        https://python.org
echo.
pause
exit /b 1

:abrirnavegador
start "" cmd /c "ping -n 3 127.0.0.1 >nul & start %URL%"
goto :eof

:fin
echo.
echo Servidor detenido.
pause
