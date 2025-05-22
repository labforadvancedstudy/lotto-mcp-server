#!/bin/bash

# npm 패키지 배포 가이드 스크립트

set -e

echo "📦 npm 패키지 배포 가이드"
echo "================================"

# 현재 단계 확인
check_step() {
    echo ""
    echo "🔍 $1 확인 중..."
}

# npm 로그인 상태 확인
check_step "npm 로그인 상태"
if npm whoami > /dev/null 2>&1; then
    NPM_USER=$(npm whoami)
    echo "✅ npm에 로그인됨: $NPM_USER"
else
    echo "❌ npm에 로그인되지 않음"
    echo ""
    echo "📝 npm 계정이 필요합니다:"
    echo "1. https://www.npmjs.com 에서 계정 생성"
    echo "2. 터미널에서 'npm login' 실행"
    echo "3. 이메일 인증 완료"
    echo ""
    read -p "지금 npm login을 실행하시겠습니까? (y/N): " login_now
    
    if [[ $login_now =~ ^[Yy]$ ]]; then
        npm login
        NPM_USER=$(npm whoami)
        echo "✅ 로그인 완료: $NPM_USER"
    else
        echo "❌ npm 로그인이 필요합니다."
        exit 1
    fi
fi

# package.json 업데이트 확인
check_step "package.json 설정"
if [ ! -f "package.json" ]; then
    echo "❌ package.json 파일이 없습니다."
    exit 1
fi

# 패키지명 확인 및 업데이트
CURRENT_NAME=$(node -p "require('./package.json').name")
if [[ $CURRENT_NAME == *"your-username"* ]]; then
    echo "⚠️  패키지명에 'your-username'이 포함되어 있습니다."
    echo "현재 패키지명: $CURRENT_NAME"
    echo ""
    echo "📝 패키지명을 업데이트해주세요:"
    echo "예시: @$NPM_USER/lotto-mcp-server"
    
    read -p "새로운 패키지명 입력: " new_name
    if [ ! -z "$new_name" ]; then
        # package.json 업데이트 (간단한 sed 사용)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|\"name\": \".*\"|\"name\": \"$new_name\"|" package.json
        else
            # Linux
            sed -i "s|\"name\": \".*\"|\"name\": \"$new_name\"|" package.json
        fi
        echo "✅ 패키지명 업데이트: $new_name"
    fi
fi

# 빌드 확인
check_step "프로젝트 빌드"
if [ ! -d "dist" ]; then
    echo "📦 빌드 실행 중..."
    npm run build
fi

if [ ! -f "dist/index.js" ]; then
    echo "❌ 빌드 실패 - dist/index.js가 없습니다."
    exit 1
fi

echo "✅ 빌드 완료"

# bin 파일 실행 권한 확인
check_step "실행 파일 권한"
if [ -f "bin/lotto-mcp.js" ]; then
    chmod +x bin/lotto-mcp.js
    echo "✅ bin/lotto-mcp.js 실행 권한 설정"
fi

# 로컬 테스트
echo ""
echo "🧪 로컬 테스트 실행"
echo "================================"

echo "1️⃣ npm pack 테스트..."
npm pack

PACKAGE_FILE=$(ls *.tgz | head -1)
echo "📦 패키지 파일 생성: $PACKAGE_FILE"

echo ""
echo "2️⃣ 도움말 테스트..."
node bin/lotto-mcp.js --help

echo ""
echo "3️⃣ 버전 테스트..."
node bin/lotto-mcp.js --version

echo ""
echo "4️⃣ 계정 인코딩 테스트..."
node bin/lotto-mcp.js --encode "test_id" "test_password"

# 배포 방식 선택
echo ""
echo "🚀 배포 방식 선택"
echo "================================"
echo "1. 테스트 배포 (--dry-run)"
echo "2. 베타 배포 (--tag beta)"
echo "3. 정식 배포"
echo ""

read -p "선택 (1-3): " deploy_choice

case $deploy_choice in
    1)
        echo "🧪 테스트 배포 실행 중..."
        npm publish --dry-run
        echo ""
        echo "✅ 테스트 배포 완료! 실제로는 배포되지 않았습니다."
        ;;
    2)
        echo "🚀 베타 배포 실행 중..."
        npm publish --tag beta
        PACKAGE_NAME=$(node -p "require('./package.json').name")
        echo ""
        echo "✅ 베타 배포 완료!"
        echo "📦 설치: npm install $PACKAGE_NAME@beta"
        echo "🎯 실행: npx $PACKAGE_NAME --help"
        ;;
    3)
        echo "🚀 정식 배포 실행 중..."
        npm publish
        PACKAGE_NAME=$(node -p "require('./package.json').name")
        echo ""
        echo "🎉 정식 배포 완료!"
        echo "📦 설치: npm install -g $PACKAGE_NAME"
        echo "🎯 실행: npx $PACKAGE_NAME --help"
        ;;
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

# 사용 가이드
echo ""
echo "📋 사용자 가이드"
echo "================================"

PACKAGE_NAME=$(node -p "require('./package.json').name")

cat << EOF
사용자들이 다음과 같이 사용할 수 있습니다:

🔧 계정 설정:
npx $PACKAGE_NAME --setup

🎯 Claude Desktop 설정:
{
  "mcpServers": {
    "lotto": {
      "command": "npx",
      "args": ["$PACKAGE_NAME"],
      "env": {
        "LOTTO_CREDENTIALS": "base64_encoded_credentials"
      }
    }
  }
}

📖 전체 명령어:
npx $PACKAGE_NAME --help

EOF

# 정리
echo "🧹 임시 파일 정리..."
rm -f *.tgz

echo ""
echo "🎉 npm 패키지 배포 완료!"
echo ""
echo "📊 배포 상태 확인:"
echo "https://www.npmjs.com/package/$PACKAGE_NAME"