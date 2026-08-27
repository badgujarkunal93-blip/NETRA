Write-Host "=== 1. PUBLIC TEST: GET https://netra-gd70.onrender.com/health ==="
$health = Invoke-RestMethod -Uri "https://netra-gd70.onrender.com/health" -Method GET
$health | Format-List

Write-Host "`n=== 2. PUBLIC TEST: POST https://netra-gd70.onrender.com/score ==="
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

$scoreRes = Invoke-RestMethod -Uri "https://netra-gd70.onrender.com/score" -Method POST -Body $body -ContentType "application/json"
$scoreRes | Format-List
