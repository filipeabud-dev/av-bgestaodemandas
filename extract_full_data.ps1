$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
try {
    $path = "C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\Plano de Ação AVB.xlsx"
    $wb = $excel.Workbooks.Open($path)
    
    $results = @{}

    # Sheet: Time
    $sheetTime = $wb.Sheets.Item("Time")
    $rowsTime = $sheetTime.UsedRange.Rows.Count
    $colsTime = $sheetTime.UsedRange.Columns.Count
    $dataTime = @()
    for ($r = 2; $r -le $rowsTime; $r++) {
        if ($sheetTime.Cells.Item($r, 1).Text -ne "") {
            $obj = @{
                id = $r - 1
                area = $sheetTime.Cells.Item($r, 1).Text
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
    $sheetNB = $wb.Sheets.Item("Troca Notebooks Home VMix")
    $rowsNB = $sheetNB.UsedRange.Rows.Count
    $dataNB = @()
    for ($r = 2; $r -le $rowsNB; $r++) {
        if ($sheetNB.Cells.Item($r, 3).Text -ne "") {
            $obj = @{
                id = $r - 1
                situacao = $sheetNB.Cells.Item($r, 1).Text
                quantidade = $sheetNB.Cells.Item($r, 2).Text
                professor = $sheetNB.Cells.Item($r, 3).Text
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

    $results | ConvertTo-Json -Depth 5 | Out-File "C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\extracted_data.json" -Encoding utf8
} finally {
    $wb.Close($false)
    $excel.Quit()
}
