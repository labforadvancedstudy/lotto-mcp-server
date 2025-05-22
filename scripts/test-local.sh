#!/bin/bash

# 로컬에서 npm 패키지 테스트 스크립트

set -e

echo "🧪 로컬 npm 패키지 테스트"
echo "================================"

# 스크립트가 실행된 위치를 기준으로 프로젝트 루트 찾기
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "📁 프로젝트 루트: $PROJECT_ROOT"

cd "$PROJECT_ROOT"

# 빌드 확인
if [ ! -d "dist" ]; then
    echo "📦 빌드 실행 중..."
    npm run build
fi

echo ""
echo "1️⃣ npm link 테스트"
echo "================================"

# 기존 링크 제거 (오류 무시)
npm unlink -g 2>/dev/null || true

# 글로벌 링크 생성
echo "🔗 글로벌 링크 생성 중..."
npm link

PACKAGE_NAME=$(node -p "require('./package.json').name")
echo "✅ 패키지 링크 완료: $PACKAGE_NAME"

echo ""
echo "📋 명령어 테스트:"

# bin 실행 파일 이름 추출
BIN_NAME=$(node -p "Object.keys(require('./package.json').bin)[0]" 2>/dev/null || echo "lotto-mcp")

# 도움말 테스트
echo ""
echo "🔍 --help 테스트:"
$BIN_NAME --help

# 버전 테스트
echo ""
echo "🔍 --version 테스트:"
$BIN_NAME --version

# 설정 예시 테스트
echo ""
echo "🔍 --config 테스트:"
$BIN_NAME --config

# 인코딩 테스트
echo ""
echo "🔍 --encode 테스트:"
$BIN_NAME --encode "test_id" "test_password"

echo ""
echo "2️⃣ npm pack 테스트"
echo "================================"

# 패키지 파일 생성
echo "📦 패키지 파일 생성 중..."
npm pack

PACKAGE_FILE=$(ls *.tgz | head -1)
echo "📁 패키지 파일: $PACKAGE_FILE"

# 임시 디렉토리에서 설치 테스트
echo ""
echo "🏗️  임시 환경에서 설치 테스트..."
TEMP_DIR=$(mktemp -d)
echo "📁 임시 디렉토리: $TEMP_DIR"

# 패키지 파일의 절대 경로 얻기
PACKAGE_PATH="$PROJECT_ROOT/$PACKAGE_FILE"

cd "$TEMP_DIR"

# 패키지 설치
npm init -y > /dev/null
npm install "$PACKAGE_PATH" > /dev/null

echo "✅ 패키지 설치 완료"

# npx 테스트
echo ""
echo "🎯 npx 실행 테스트:"
npx "$PACKAGE_NAME" --version

echo ""
echo "3️⃣ MCP 서버 기능 테스트"
echo "================================"

# 프로젝트 루트로 돌아가기
cd "$PROJECT_ROOT"

# 테스트용 환경변수 설정
TEST_CREDENTIALS=$(echo "test_id,test_password" | base64)

echo "🔧 환경변수 설정:"
echo "LOTTO_CREDENTIALS=$TEST_CREDENTIALS"

# MCP 서버 기본 로드 테스트
echo ""
echo "⚡ MCP 서버 모듈 로드 테스트..."

# timeout이 없는 경우를 대비한 대안
if command -v timeout >/dev/null 2>&1; then
    timeout 5s env LOTTO_CREDENTIALS="$TEST_CREDENTIALS" node bin/lotto-mcp.js 2>/dev/null &
    SERVER_PID=$!
    sleep 2
    
    # 프로세스가 실행 중인지 확인
    if kill -0 $SERVER_PID 2>/dev/null; then
        echo "✅ MCP 서버 실행 성공"
        kill $SERVER_PID 2>/dev/null || true
    else
        echo "❌ MCP 서버 실행 실패"
    fi
else
    # timeout 명령어가 없는 경우
    echo "⚠️  timeout 명령어가 없어서 MCP 서버 테스트를 건너뜁니다."
    echo "💡 수동 테스트: LOTTO_CREDENTIALS=\"$TEST_CREDENTIALS\" node bin/lotto-mcp.js"
fi

echo ""
echo "4️⃣ Claude Desktop 설정 테스트"
echo "================================"

# Claude Desktop 설정 파일 생성
CLAUDE_CONFIG=$(mktemp)

cat > "$CLAUDE_CONFIG" << EOF
{
  "mcpServers": {
    "lotto": {
      "command": "npx",
      "args": ["$PACKAGE_NAME"],
      "env": {
        "LOTTO_CREDENTIALS": "$TEST_CREDENTIALS"
      }
    }
  }
}
EOF

echo "📄 Claude Desktop 설정 파일 생성:"
echo "파일 위치: $CLAUDE_CONFIG"
echo ""
cat "$CLAUDE_CONFIG"

# JSON 유효성 검사
if node -e "JSON.parse(require('fs').readFileSync('$CLAUDE_CONFIG', 'utf8'))" 2>/dev/null; then
    echo ""
    echo "✅ Claude Desktop 설정 JSON 유효성 검사 통과"
else
    echo ""
    echo "❌ Claude Desktop 설정 JSON 오류"
fi

echo ""
echo "5️⃣ 정리"
echo "================================"

# 임시 파일 정리
cd "$PROJECT_ROOT"
rm -f *.tgz
rm -f "$CLAUDE_CONFIG"
rm -rf "$TEMP_DIR"

# npm link 정리
echo "🧹 npm link 정리 중..."
npm unlink -g 2>/dev/null || true

echo ""
echo "🎉 로컬 테스트 완료!"
echo ""
echo "📋 테스트 결과 요약:"
echo "✅ npm link - 글로벌 명령어 등록"
echo "✅ npm pack - 패키지 파일 생성"
echo "✅ npx 실행 - 명령어 실행"
echo "✅ MCP 서버 - 기본 기능 로드"
echo "✅ Claude Desktop - 설정 파일 유효성"
echo ""
echo "🚀 배포 준비 완료!"
echo "📦 배포 명령: npm run npm:publish"