@echo off
echo ===================================================
echo   ACTUALIZADOR AUTOMATICO DE WEB EPI LAZARTE
echo ===================================================
echo.
echo 1. Descargando ultimas mejoras de la nube...
git pull --rebase

echo.
echo 2. Agregando tus archivos nuevos...
git add .

echo.
echo 3. Guardando cambios locales...
git commit -m "Actualizacion de contenido - %date% %time%"

echo.
echo 4. Subiendo todo a la Nube...
git push

echo.
echo ===================================================
echo   !LISTO! Tu web se actualizara en 1-2 minutos.
echo ===================================================
timeout /t 10