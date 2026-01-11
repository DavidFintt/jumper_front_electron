# Script de Uninstall - Desvincula dispositivo da empresa
# Este script deve ser executado durante o processo de desinstalação do aplicativo

param(
    [string]$CompanyId = "",
    [string]$AccessToken = "",
    [string]$ApiUrl = "http://localhost:8000"
)

Write-Host "🔧 Iniciando desvinculação do dispositivo..." -ForegroundColor Cyan

# Verificar se os parâmetros foram fornecidos
if ([string]::IsNullOrEmpty($CompanyId) -or [string]::IsNullOrEmpty($AccessToken)) {
    Write-Host "⚠️  Parâmetros não fornecidos. Tentando ler do registro..." -ForegroundColor Yellow
    
    # Tentar ler do registro do Windows (se disponível)
    $regPath = "HKCU:\Software\JumpSystem"
    if (Test-Path $regPath) {
        $CompanyId = (Get-ItemProperty -Path $regPath -Name "CompanyId" -ErrorAction SilentlyContinue).CompanyId
        $AccessToken = (Get-ItemProperty -Path $regPath -Name "AccessToken" -ErrorAction SilentlyContinue).AccessToken
    }
    
    if ([string]::IsNullOrEmpty($CompanyId) -or [string]::IsNullOrEmpty($AccessToken)) {
        Write-Host "❌ Não foi possível obter os dados necessários. Pulando desvinculação." -ForegroundColor Red
        exit 0
    }
}

# Obter Machine ID usando node-machine-id
Write-Host "📱 Obtendo Machine ID..." -ForegroundColor Cyan

$nodePath = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodePath) {
    Write-Host "⚠️  Node.js não encontrado. Tentando usar método alternativo..." -ForegroundColor Yellow
    
    # Método alternativo: usar um ID baseado no hardware
    $machineId = (Get-WmiObject Win32_ComputerSystemProduct).UUID
    if ([string]::IsNullOrEmpty($machineId)) {
        $machineId = (Get-WmiObject Win32_BIOS).SerialNumber
    }
} else {
    # Tentar usar node-machine-id se disponível
    $machineIdScript = @"
        const { machineId } = require('node-machine-id');
        machineId().then(id => console.log(id)).catch(() => {
            const os = require('os');
            console.log(os.hostname() + '-' + os.platform() + '-' + os.arch());
        });
"@
    
    try {
        $machineId = node -e $machineIdScript 2>$null
        if ([string]::IsNullOrEmpty($machineId)) {
            throw "Erro ao obter machine ID"
        }
    } catch {
        # Fallback para método alternativo
        $machineId = (Get-WmiObject Win32_ComputerSystemProduct).UUID
        if ([string]::IsNullOrEmpty($machineId)) {
            $machineId = (Get-WmiObject Win32_BIOS).SerialNumber
        }
    }
}

if ([string]::IsNullOrEmpty($machineId)) {
    Write-Host "❌ Não foi possível obter Machine ID. Pulando desvinculação." -ForegroundColor Red
    exit 0
}

Write-Host "✅ Machine ID obtido: $machineId" -ForegroundColor Green

# Chamar API para desvincular
Write-Host "🌐 Desvinculando dispositivo da empresa $CompanyId..." -ForegroundColor Cyan

$body = @{
    company_id = [int]$CompanyId
    machine_id = $machineId
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/company-machines/unregister/" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $AccessToken"
        } `
        -Body $body `
        -ErrorAction Stop

    if ($response.success) {
        Write-Host "✅ Dispositivo desvinculado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Resposta da API: $($response.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Erro ao desvincular dispositivo: $($_.Exception.Message)" -ForegroundColor Red
    # Não falhar o uninstall mesmo se a desvinculação falhar
}

Write-Host "✅ Processo de desvinculação concluído." -ForegroundColor Green






















