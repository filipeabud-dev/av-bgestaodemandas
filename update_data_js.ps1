$data = Get-Content 'C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\extracted_data.json' -Raw | ConvertFrom-Json
$demandasJson = $data.demandas | ConvertTo-Json -Depth 10
$notebooksJson = $data.notebooks | ConvertTo-Json -Depth 10

$header = "// =====================================================
// AVB Gestão de Demandas — Dados Reais Extraídos
// ====================================================="

$users = "const DEFAULT_USERS = [
  { id: 1, username: 'admin', password: 'av&b123', role: 'admin', name: 'Administrador AVB', approved: true },
  { id: 2, username: 'gestor', password: 'avb@2026', role: 'gestor', name: 'Gestor de Demandas', approved: true },
  { id: 3, username: 'viewer', password: 'avb@2026', role: 'viewer', name: 'Visualizador', approved: true }
];"

$init = "function initializeData() {
  if (!localStorage.getItem('avb_initialized')) {
    localStorage.setItem('avb_users', JSON.stringify(DEFAULT_USERS));
    localStorage.setItem('avb_demandas', JSON.stringify(SAMPLE_DEMANDAS));
    localStorage.setItem('avb_notebooks', JSON.stringify(SAMPLE_NOTEBOOKS));
    localStorage.setItem('avb_history', JSON.stringify([]));
    localStorage.setItem('avb_initialized', 'true');
  }
}"

$content = "$header`n`n$users`n`nconst SAMPLE_DEMANDAS = $demandasJson;`n`nconst SAMPLE_NOTEBOOKS = $notebooksJson;`n`n$init"

$content | Out-File 'C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\avb-gestao\data.js' -Encoding utf8
