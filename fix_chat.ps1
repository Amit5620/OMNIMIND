$filePath = "c:\Users\USER\OneDrive\Desktop\omnimind new\omnimind\src\pages\Workspace. tsx"
$content = Get-Content $filePath -Raw
$content = $content -replace 'user_ id', 'user_ id'
$content | Set-Content $filePath -NoNewline
Write-Host "Fixed user_ id"
