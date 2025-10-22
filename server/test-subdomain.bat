@echo off
echo Testing subdomain routing...

echo.
echo 1. Setting up database...
psql -h localhost -U postgres -d momentza -f Database\schema.sql

echo.
echo 2. Testing subdomain resolution...
echo Visit: http://pakshi.localhost:5212/
echo Expected redirect to: http://192.168.1.21:8080/ddae3baf-3c43-41ba-8f79-c5bb73f60cfd

echo.
echo 3. Starting server...
echo Press Ctrl+C to stop the server
dotnet run
