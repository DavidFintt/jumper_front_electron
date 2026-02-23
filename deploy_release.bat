@echo off
scp -i "C:\Users\David Finotto\.ssh\id_ed25519" "jumpersystem.zip" root@177.153.38.167:/root/files_download/
if %errorlevel% neq 0 (
    echo Erro ao enviar!
) else (
    echo Enviado com sucesso!
)
pause