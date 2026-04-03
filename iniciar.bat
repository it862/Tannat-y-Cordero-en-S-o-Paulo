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

REM ── Matar procesos previos en puertos comunes ──
for %%p in (3000 3001 8080) do (
    for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":%%p " ^| findstr "LISTENING"') do (
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM ── Elegir puerto ──
set PORT=3000
set URL=http://localhost:%PORT%

REM ── Detectar Node.js / npx ──
where npx >nul 2>&1
if not errorlevel 1 (
    echo [OK] Node.js detectado. Usando npx serve...
    echo.
    echo ============================================
    echo   Servidor en: %URL%
    echo   Ctrl+C para detener
    echo ============================================
    echo.

    REM Abrir navegador con delay de 3 segundos
    start "" cmd /c "timeout /t 3 /nobreak >nul & start %URL%"

    REM Iniciar servidor (bloquea hasta Ctrl+C)
    npx --yes serve@latest . -p %PORT% -s --no-clipboard
    goto :fin
)

REM ── Fallback: Python ──
where python >nul 2>&1
if not errorlevel 1 (
    echo [OK] Python detectado. Usando http.server...
    echo.
    echo ============================================
    echo   Servidor en: %URL%
    echo   Ctrl+C para detener
    echo ============================================
    echo.

    start "" cmd /c "timeout /t 2 /nobreak >nul & start %URL%"
    python -m http.server %PORT%
    goto :fin
)

REM ── Fallback: Python3 ──
where python3 >nul 2>&1
if not errorlevel 1 (
    echo [OK] Python3 detectado. Usando http.server...
    echo.
    echo ============================================
    echo   Servidor en: %URL%
    echo   Ctrl+C para detener
    echo ============================================
    echo.

    start "" cmd /c "timeout /t 2 /nobreak >nul & start %URL%"
    python3 -m http.server %PORT%
    goto :fin
)

REM ── Sin runtime ──
echo.
echo ERROR: No se encontro Node.js ni Python.
echo.
echo Instala Node.js desde: https://nodejs.org
echo O Python desde:        https://python.org
echo.
pause
exit /b 1

:fin
echo.
echo Servidor detenido.
pause
