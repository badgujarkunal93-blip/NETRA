Write-Host "=== 1. TEST /health ENDPOINT ==="
$health = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method GET
$health | Format-List

Write-Host "`n=== 2. TEST /score ENDPOINT ==="
$payload = @{
    network_centrality = 0.5
    direct_connection_count = 3
    observed_vs_inferred_ratio = 0.8
    avg_relationship_confidence = 0.7
    role_weight = 1.0
    prior_case_count = 2
    mo_case_match_flag = 1
    evidence_count = 4
    alert_count = 1
    avg_alert_confidence = 0.6
}
$body = $payload | ConvertTo-Json

$scoreRes = Invoke-RestMethod -Uri "http://127.0.0.1:8000/score" -Method POST -Body $body -ContentType "application/json"
$scoreRes | Format-List
