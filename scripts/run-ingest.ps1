# Script để chạy ingest SGK vào Vectorize
# Cần có tài khoản giáo viên/admin để chạy

$API_URL = "https://stem-vietnam-api.stu725114073.workers.dev"

# Đăng nhập (thay đổi email/password của bạn)
$loginBody = @{
    email = "long@test.com"
    password = "123456"
} | ConvertTo-Json

Write-Host "Đang đăng nhập..." -ForegroundColor Cyan
$loginResult = Invoke-RestMethod -Method POST -Uri "$API_URL/api/auth/login" -ContentType "application/json" -Body $loginBody

if (-not $loginResult.token) {
    Write-Host "Đăng nhập thất bại!" -ForegroundColor Red
    Write-Host $loginResult
    exit 1
}

Write-Host "Đăng nhập thành công: $($loginResult.user.name)" -ForegroundColor Green
$token = $loginResult.token

# Dry run để xem files
Write-Host "`nDry run - Liệt kê files..." -ForegroundColor Cyan
$ingestBody = @{
    prefix = "dulieu/SGK/"
    dryRun = $true
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
}

$dryResult = Invoke-RestMethod -Method POST -Uri "$API_URL/api/ingest" -ContentType "application/json" -Body $ingestBody -Headers $headers
Write-Host "Files tìm thấy: $($dryResult.files -join ', ')" -ForegroundColor Yellow
Write-Host "Tổng: $($dryResult.files.Count) files"

# Hỏi có muốn ingest không
$confirm = Read-Host "`nBạn có muốn ingest $($dryResult.files.Count) files vào Vectorize? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Đã hủy." -ForegroundColor Red
    exit 0
}

# Chạy ingest thật
Write-Host "`nĐang ingest..." -ForegroundColor Cyan
$ingestBody = @{
    prefix = "dulieu/SGK/"
    dryRun = $false
} | ConvertTo-Json

$result = Invoke-RestMethod -Method POST -Uri "$API_URL/api/ingest" -ContentType "application/json" -Body $ingestBody -Headers $headers

Write-Host "`n=== KẾT QUẢ INGEST ===" -ForegroundColor Green
Write-Host "Files đã xử lý: $($result.filesProcessed)"
Write-Host "Chunks đã insert: $($result.chunksInserted)"
Write-Host "Lỗi: $($result.errors.Count)"

if ($result.errors.Count -gt 0) {
    Write-Host "`nCác lỗi:" -ForegroundColor Red
    $result.errors | ForEach-Object { Write-Host "  - $_" }
}

Write-Host "`nHoàn thành!" -ForegroundColor Green
