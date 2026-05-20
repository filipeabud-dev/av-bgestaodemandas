$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    # Find the file using wildcard to avoid encoding issues with special characters
    $dir = "C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\"
    $file = Get-ChildItem -Path $dir -Filter "*.xlsx" | Where-Object { $_.Name -like "*Plano*" } | Select-Object -First 1
    if (-not $file) { throw "File not found" }
    $path = $file.FullName
    Write-Host "Opening: $path"
    $wb = $excel.Workbooks.Open($path)
    
    $results = @{}

    # Sheet: Time
    $sheetTime = $wb.Sheets.Item("Time")
    $rowsTime = $sheetTime.UsedRange.Rows.Count
    $dataTime = @()
    for ($r = 2; $r -le $rowsTime; $r++) {
        $val1 = $sheetTime.Cells.Item($r, 1).Text
        if ($val1 -ne "") {
            $obj = @{
                id = $r - 1
                area = $val1
                assunto = $sheetTime.Cells.Item($r, 2).Text
                atividades = $sheetTime.Cells.Item($r, 3).Text
                dataPrevista = $sheetTime.Cells.Item($r, 4).Text
                responsavel = $sheetTime.Cells.Item($r, 5).Text
                status = $sheetTime.Cells.Item($r, 6).Text
                observacoes = $sheetTime.Cells.Item($r, 7).Text
            }
            $dataTime += $obj
        }
    }
    $results["demandas"] = $dataTime

    # Sheet: Troca Notebooks Home VMix
    try {
        $sheetNB = $wb.Sheets.Item("Troca Notebooks Home VMix")
    } catch {
        # Try finding by partial name
        foreach($s in $wb.Sheets) { if($s.Name -like "*Notebook*") { $sheetNB = $s; break } }
    }
    
    if ($sheetNB) {
        $rowsNB = $sheetNB.UsedRange.Rows.Count
        $dataNB = @()
        for ($r = 2; $r -le $rowsNB; $r++) {
            $prof = $sheetNB.Cells.Item($r, 3).Text
            if ($prof -ne "") {
                $obj = @{
                    id = $r - 1
                    situacao = $sheetNB.Cells.Item($r, 1).Text
                    quantidade = $sheetNB.Cells.Item($r, 2).Text
                    professor = $prof
                    horasMes1 = $sheetNB.Cells.Item($r, 4).Text
                    horasMes2 = $sheetNB.Cells.Item($r, 5).Text
                    horasMes3 = $sheetNB.Cells.Item($r, 6).Text
                    media3Meses = $sheetNB.Cells.Item($r, 7).Text
                    kitTipo = $sheetNB.Cells.Item($r, 8).Text
                    notaAvaliacao = $sheetNB.Cells.Item($r, 9).Text
                    modeloAntigo = $sheetNB.Cells.Item($r, 10).Text
                    anoMaquina = $sheetNB.Cells.Item($r, 11).Text
                    localidade = $sheetNB.Cells.Item($r, 12).Text
                    checkHardware = $sheetNB.Cells.Item($r, 13).Text
                }
                $dataNB += $obj
            }
        }
        $results["notebooks"] = $dataNB
    }

    $results | ConvertTo-Json -Depth 5 | Out-File "C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\extracted_data.json" -Encoding utf8
    Write-Host "Success: extracted_data.json created."
} catch {
    Write-Host "Error: $($_.Exception.Message)"
} finally {
    if ($wb) { $wb.Close($false) }
    $excel.Quit()
}
