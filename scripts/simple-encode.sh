#!/bin/bash

# 로또 계정 정보 간단 인코딩 스크립트
# 사용법: ./scripts/simple-encode.sh

echo "🔐 로또 계정 정보 간단 인코딩"
echo "================================"
echo ""

# ID 입력
read -p "동행복권 ID: " LOTTO_ID

# 패스워드 입력 (숨김)
read -s -p "동행복권 패스워드: " LOTTO_PASSWORD
echo ""
echo ""

# Base64 인코딩
ENCODED=$(echo -n "${LOTTO_ID},${LOTTO_PASSWORD}" | base64)

echo "✅ 인코딩 완료!"
echo ""
echo "🔑 Base64 인코딩된 계정 정보:"
echo "================================"
echo "인코딩된 계정: ${ENCODED}"
echo ""
echo "💡 직접 터미널에서 생성하는 방법:"
echo "================================"
echo "echo \"${LOTTO_ID},${LOTTO_PASSWORD}\" | base64"
echo ""
echo "📋 Claude Desktop 설정 파일 (claude_desktop_config.json):"
echo "================================"
cat << EOF
{
  "mcpServers": {
    "lotto": {
      "command": "node",
      "args": ["path/to/lotto-mcp-server/dist/index.js"],
      "env": {
        "LOTTO_CREDENTIALS": "${ENCODED}"
      }
    }
  }
}
EOF
echo ""
echo "📝 사용법:"
echo "1. 위의 설정을 claude_desktop_config.json에 복사하세요"
echo "2. \"path/to/lotto-mcp-server/dist/index.js\"를 실제 경로로 변경하세요"
echo "3. Claude Desktop을 재시작하세요"
echo "4. 이제 \"로또 3게임 구매해줘\"라고 말하면 됩니다!"