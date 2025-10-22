@echo off
echo Setting up Momentza database...

REM Check if psql is available
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo PostgreSQL client (psql) not found. Please install PostgreSQL or add it to PATH.
    pause
    exit /b 1
)

echo Creating database schema...
psql -h localhost -U postgres -d momentza -f Database\schema.sql

if %ERRORLEVEL% EQU 0 (
    echo Database setup completed successfully!
) else (
    echo Database setup failed. Please check the error messages above.
)

pause
