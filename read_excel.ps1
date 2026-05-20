$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$wb = $excel.Workbooks.Open('c:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\Plano de Ação AVB.xlsx')
Write-Host "Total sheets: $($wb.Sheets.Count)"
for ($s = 1; $s -le $wb.Sheets.Count; $s++) {
    $sheet = $wb.Sheets.Item($s)
    Write-Host "=== Sheet: $($sheet.Name) ==="
    $usedRange = $sheet.UsedRange
    Write-Host "Rows: $($usedRange.Rows.Count) Cols: $($usedRange.Columns.Count)"
    for ($r = 1; $r -le [Math]::Min(15, $usedRange.Rows.Count); $r++) {
        $rowData = @()
        for ($c = 1; $c -le $usedRange.Columns.Count; $c++) {
            $rowData += $sheet.Cells.Item($r, $c).Text
        }
        Write-Host "Row $r : $($rowData -join ' | ')"
    }
}
$wb.Close($false)
$excel.Quit()
Write-Host "Done."
