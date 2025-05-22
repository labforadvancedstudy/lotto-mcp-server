#!/bin/bash

# 간단한 MCP 서버 테스트 스크립트

echo "🧪 MCP 서버 간단 테스트"
echo "================================"

# 빌드 확인
if [ ! -f "dist/index.js" ]; then
    echo "📦 빌드 실행 중..."
    npm run build
fi

# 테스트용 계정 정보
TEST_CREDENTIALS=$(echo "test_id,test_password" | base64)
echo "🔧 테스트 계정: $TEST_CREDENTIALS"
echo ""

echo "1️⃣ 도구 목록 확인 테스트"
echo "=========================="

# 도구 목록 요청 JSON
TOOLS_REQUEST='{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'

echo "📤 요청: $TOOLS_REQUEST"
echo "📥 응답:"

# MCP 서버를 백그라운드로 실행
env LOTTO_CREDENTIALS="$TEST_CREDENTIALS" node dist/index.js &
SERVER_PID=$!

# 서버 시작 대기
sleep 2

# 요청 전송
echo "$TOOLS_REQUEST" | node -e "
process.stdin.on('data', (data) => {
  console.log('📨 전송:', data.toString().trim());
});
process.stdin.pipe(process.stdout);
" &

# 짧은 대기
sleep 1

# 서버 종료
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "2️⃣ 로또 당첨 확인 테스트"
echo "=========================="

# 당첨 확인 요청 JSON
CHECK_REQUEST='{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"check_lotto_winning","arguments":{"numbers":[[1,2,3,4,5,6],[7,8,9,10,11,12]]}}}'

echo "📤 요청: $CHECK_REQUEST"
echo "📥 응답:"

# MCP 서버를 백그라운드로 실행
env LOTTO_CREDENTIALS="$TEST_CREDENTIALS" node dist/index.js &
SERVER_PID=$!

# 서버 시작 대기
sleep 2

# 요청 전송 후 응답 수집
(echo "$CHECK_REQUEST"; sleep 2) | env LOTTO_CREDENTIALS="$TEST_CREDENTIALS" node dist/index.js 2>&1 &
TEST_PID=$!

# 테스트 대기
sleep 5

# 정리
kill $SERVER_PID 2>/dev/null || true
kill $TEST_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
wait $TEST_PID 2>/dev/null || true

echo ""
echo "✅ 테스트 완료"
echo ""
echo "💡 수동 테스트 방법:"
echo "   1. 터미널 1: LOTTO_CREDENTIALS=\"$TEST_CREDENTIALS\" node dist/index.js"
echo "   2. 터미널 2: echo '$TOOLS_REQUEST' | 위 터미널에 붙여넣기"