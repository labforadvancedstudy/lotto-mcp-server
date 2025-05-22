#!/bin/bash

# 로또 MCP 서버 Docker 빌드 및 실행 스크립트

set -e

echo "🐳 로또 MCP 서버 Docker 설정"
echo "================================"

# 환경변수 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다."
    echo "📝 .env.template을 복사하여 .env 파일을 생성하고 계정 정보를 설정하세요."
    
    read -p "🔧 .env 파일을 자동으로 생성하시겠습니까? (y/N): " create_env
    
    if [[ $create_env =~ ^[Yy]$ ]]; then
        cp .env.template .env
        echo "✅ .env 파일이 생성되었습니다."
        echo "📝 .env 파일을 편집하여 계정 정보를 설정해주세요."
        echo ""
        
        # 간단한 계정 설정 도우미
        read -p "🔐 계정 정보를 바로 설정하시겠습니까? (y/N): " setup_account
        
        if [[ $setup_account =~ ^[Yy]$ ]]; then
            echo ""
            read -p "동행복권 ID: " lotto_id
            read -s -p "동행복권 패스워드: " lotto_password
            echo ""
            
            # Base64 인코딩
            credentials=$(echo -n "${lotto_id},${lotto_password}" | base64)
            
            # .env 파일에 추가
            echo "LOTTO_CREDENTIALS=${credentials}" >> .env
            echo "LOG_LEVEL=2" >> .env
            
            echo "✅ 계정 정보가 .env 파일에 설정되었습니다."
        else
            echo "📝 .env 파일을 수동으로 편집해주세요."
            exit 1
        fi
    else
        echo "📝 .env 파일을 생성한 후 다시 실행해주세요."
        exit 1
    fi
fi

echo ""
echo "🔨 Docker 이미지 빌드 중..."
docker build -t lotto-mcp-server:latest .

echo ""
echo "🚀 Docker 컨테이너 실행 중..."
docker-compose up -d

echo ""
echo "✅ 로또 MCP 서버가 성공적으로 실행되었습니다!"
echo ""
echo "📋 Claude Desktop 설정:"
echo "================================"

# 컨테이너 실행 명령어 생성
container_path=$(docker inspect --format='{{.Path}}' lotto-mcp-server 2>/dev/null || echo "node")
container_args='["dist/index.js"]'

cat << EOF
{
  "mcpServers": {
    "lotto": {
      "command": "docker",
      "args": [
        "exec", "-i", 
        "lotto-mcp-server", 
        "node", "dist/index.js"
      ]
    }
  }
}
EOF

echo ""
echo "📝 사용법:"
echo "1. 위의 설정을 claude_desktop_config.json에 복사하세요"
echo "2. Claude Desktop을 재시작하세요"
echo "3. Claude에서 '로또 3게임 구매해줘'라고 말하면 됩니다!"
echo ""
echo "🔍 로그 확인: docker logs -f lotto-mcp-server"
echo "🛑 서버 중지: docker-compose down"