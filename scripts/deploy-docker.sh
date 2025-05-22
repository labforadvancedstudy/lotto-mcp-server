#!/bin/bash

# Docker 이미지 빌드 및 배포 스크립트
# 사용법: ./scripts/deploy-docker.sh [dockerhub-username] [version]

set -e

# 기본값 설정
DOCKERHUB_USERNAME=${1:-"your-dockerhub-username"}
VERSION=${2:-"latest"}
IMAGE_NAME="lotto-mcp-server"
FULL_IMAGE_NAME="${DOCKERHUB_USERNAME}/${IMAGE_NAME}:${VERSION}"

echo "🐳 Docker 이미지 빌드 및 배포"
echo "================================"
echo "이미지명: ${FULL_IMAGE_NAME}"
echo ""

# Docker 로그인 확인
echo "🔐 Docker Hub 로그인 확인..."
if ! docker info | grep -q "Username:"; then
    echo "Docker Hub에 로그인해주세요:"
    docker login
fi

echo ""
echo "🔨 Docker 이미지 빌드 중..."
docker build -t ${IMAGE_NAME}:${VERSION} .
docker tag ${IMAGE_NAME}:${VERSION} ${FULL_IMAGE_NAME}

echo ""
echo "📤 Docker Hub에 이미지 푸시 중..."
docker push ${FULL_IMAGE_NAME}

# latest 태그도 함께 푸시 (버전이 latest가 아닌 경우)
if [ "${VERSION}" != "latest" ]; then
    echo "📤 latest 태그로도 푸시 중..."
    docker tag ${IMAGE_NAME}:${VERSION} ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
    docker push ${DOCKERHUB_USERNAME}/${IMAGE_NAME}:latest
fi

echo ""
echo "✅ Docker 이미지 배포 완료!"
echo ""
echo "📋 사용자들이 사용할 Claude Desktop 설정:"
echo "================================"
cat << EOF
{
  "mcpServers": {
    "lotto": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "LOTTO_CREDENTIALS=<BASE64_ENCODED_CREDENTIALS>",
        "${FULL_IMAGE_NAME}"
      ]
    }
  }
}
EOF

echo ""
echo "💡 사용자 안내사항:"
echo "1. 터미널에서 계정 정보 인코딩: echo \"id,password\" | base64"
echo "2. 위 설정의 <BASE64_ENCODED_CREDENTIALS>를 실제 값으로 교체"
echo "3. Claude Desktop 재시작"
echo ""
echo "🔍 이미지 정보:"
echo "- 이미지명: ${FULL_IMAGE_NAME}"
echo "- 크기: $(docker images ${FULL_IMAGE_NAME} --format "{{.Size}}")"
echo "- 생성일: $(docker images ${FULL_IMAGE_NAME} --format "{{.CreatedAt}}")"