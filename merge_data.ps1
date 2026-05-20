$jsonData = Get-Content -Path "C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\extracted_data.json" -Raw | ConvertFrom-Json

$jsHeader = "// =====================================================
// AVB Gestão de Demandas — Dados Reais Extraídos
// =====================================================

const DEFAULT_USERS = [
  { id: 1, username: 'admin', password: 'avb@2026', role: 'admin', name: 'Administrador AVB' },
  { id: 2, username: 'gestor', password: 'avb@2026', role: 'gestor', name: 'Gestor de Demandas' },
  { id: 3, username: 'viewer', password: 'avb@2026', role: 'viewer', name: 'Visualizador' }
];"

$demandasJson = $jsonData.demandas | ConvertTo-Json -Depth 10
$notebooksJson = $jsonData.notebooks | ConvertTo-Json -Depth 10

$jsInit = "function initializeData() {
  if (!localStorage.getItem('avb_initialized')) {
    localStorage.setItem('avb_users', JSON.stringify(DEFAULT_USERS));
    localStorage.setItem('avb_demandas', JSON.stringify(SAMPLE_DEMANDAS));
    localStorage.setItem('avb_notebooks', JSON.stringify(SAMPLE_NOTEBOOKS));
    localStorage.setItem('avb_history', JSON.stringify([]));
    localStorage.setItem('avb_initialized', 'true');
  }
}"

$finalJs = "$jsHeader`n`nconst SAMPLE_DEMANDAS = $demandasJson;`n`nconst SAMPLE_NOTEBOOKS = $notebooksJson;`n`n$jsInit"

$finalJs | Set-Content -Path "C:\Users\IsraelFilipeAbudGome\Documents\Plano de Ação AVB\avb-gestao\data.js" -Encoding UTF8
