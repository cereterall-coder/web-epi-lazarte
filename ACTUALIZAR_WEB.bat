@echo off
echo ===================================================
echo   ACTUALIZADOR AUTOMATICO DE WEB EPI LAZARTE
echo ===================================================
echo.
echo 1. Verificando cambios en Fichas y Alertas...
git add .

echo.
echo 2. Guardando cambios...
git commit -m "Actualizacion automatica de archivos - %date% %time%"

echo.
echo 3. Subiendo a la Nube (GitHub + Render)...
git push

echo.
echo ===================================================
echo   !LISTO! Tu web se actualizara en 1-2 minutos.
echo ===================================================
timeout /t 10
