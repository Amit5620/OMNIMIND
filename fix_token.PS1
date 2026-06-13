$content = Get-Content "c:\Users\USER\OneDrive\Desktop\omnimind new\omnimind\backend\.env" -Raw
$content = $content -replace "AstraCS:.*", "CbNJsHmarFTqIiRRRgauWASy:4bce57f597cacdaff20c0c66fba7"
$content | Set-Content "c:\Users\USER\OneDrive\Desktop\omnimind new\omnimind\backend\.env" -NoNewline
