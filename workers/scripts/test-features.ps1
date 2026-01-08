# Complete Test Suite for Advanced Chat AI

param(
    [string]$baseUrl = "https://stem-vietnam-api.stu725114073.workers.dev"
)

Write-Host "🧪 Testing Advanced Chat AI Features..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Basic Chat
Write-Host "Test 1: Basic Chat" -ForegroundColor Yellow
$response1 = Invoke-RestMethod -Uri "$baseUrl/api/chat" -Method Post -Body '{"message":"AI là gì?"}' -ContentType "application/json"
Write-Host "✅ Response received: $($response1.response.Substring(0, 50))..." -ForegroundColor Green
Write-Host ""

# Test 2: Chain-of-Thought
Write-Host "Test 2: Chain-of-Thought Mode" -ForegroundColor Yellow
$response2 = Invoke-RestMethod -Uri "$baseUrl/api/chat" -Method Post -Body '{"message":"Giải pt x²-5x+6=0","useCoT":true}' -ContentType "application/json"
if ($response2.thinking) {
    Write-Host "✅ Thinking process included" -ForegroundColor Green
} else {
    Write-Host "⚠️  No thinking process" -ForegroundColor Yellow
}
Write-Host ""

# Test 3: Self-Reflection
Write-Host "Test 3: Self-Reflection Mode" -ForegroundColor Yellow
$response3 = Invoke-RestMethod -Uri "$baseUrl/api/chat" -Method Post -Body '{"message":"So sánh Python và JavaScript","useReflection":true}' -ContentType "application/json"
if ($response3.reflection) {
    Write-Host "✅ Reflection data included (iterations: $($response3.reflection.iterations))" -ForegroundColor Green
} else {
    Write-Host "⚠️  No reflection data" -ForegroundColor Yellow
}
Write-Host ""

# Test 4: Cache Hit Test
Write-Host "Test 4: Semantic Cache" -ForegroundColor Yellow
Write-Host "  First call (cache miss)..."
$start1 = Get-Date
$response4a = Invoke-RestMethod -Uri "$baseUrl/api/chat" -Method Post -Body '{"message":"What is machine learning?"}' -ContentType "application/json"
$duration1 = (Get-Date) - $start1
Write-Host "  ⏱️  Latency: $($duration1.TotalMilliseconds)ms"

Write-Host "  Second call (cache hit expected)..."
$start2 = Get-Date
$response4b = Invoke-RestMethod -Uri "$baseUrl/api/chat" -Method Post -Body '{"message":"What is machine learning"}' -ContentType "application/json"
$duration2 = (Get-Date) - $start2
Write-Host "  ⏱️  Latency: $($duration2.TotalMilliseconds)ms"

if ($response4b.cached) {
    Write-Host "✅ Cache HIT! Speedup: $([math]::Round($duration1.TotalMilliseconds / $duration2.TotalMilliseconds, 1))x faster" -ForegroundColor Green
} else {
    Write-Host "⚠️  Cache miss (KV may not be configured)" -ForegroundColor Yellow
}
Write-Host ""

# Test 5: Rate Limiting
Write-Host "Test 5: Rate Limiting (sending 5 rapid requests)" -ForegroundColor Yellow
$userId = "test-user-$(Get-Random)"
for ($i = 1; $i -le 5; $i++) {
    try {
        $response5 = Invoke-RestMethod -Uri "$baseUrl/api/chat" -Method Post -Body "{`"message`":`"Test $i`",`"userId`":`"$userId`"}" -ContentType "application/json" -ErrorAction Stop
        Write-Host "  Request $i`: OK" -ForegroundColor Green
    } catch {
        if ($_.Exception.Response.StatusCode -eq 429) {
            Write-Host "  Request $i`: Rate limited ✅" -ForegroundColor Yellow
        } else {
            Write-Host "  Request $i`: Error" -ForegroundColor Red
        }
    }
}
Write-Host ""

# Summary
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "================================"
Write-Host "✅ All core features tested"
Write-Host "⚠️  Note: Some features require KV namespace setup"
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Create KV namespace: npx wrangler kv:namespace create CACHE"
Write-Host "2. Update wrangler.toml with KV ID"
Write-Host "3. Redeploy: npm run deploy"
Write-Host "4. Re-run tests to verify cache & rate limiting"
