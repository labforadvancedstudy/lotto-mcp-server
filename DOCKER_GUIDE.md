## 🤔 Docker에서 브라우저 실행이 가능한가?

### 기술적 해결책

Docker 컨테이너에서 GUI 애플리케이션(브라우저)을 실행하는 것은 도전적이지만, 다음 방법들로 해결했습니다:

#### 1. **Xvfb (Virtual Framebuffer)**
```dockerfile
# 가상 디스플레이 서버 설치
RUN apk add --no-cache xvfb dbus

# 가상 디스플레이 환경변수 설정  
ENV DISPLAY=:99
```

#### 2. **Headless 강제 모드**
```javascript
// Docker 환경 감지 및 headless 강제 설정
const isDocker = require('fs').existsSync('/.dockerenv');
const browser = await chromium.launch({
  headless: true, // 항상 headless
  args: [
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage'
  ]
});
```

#### 3. **시스템 Chromium 사용**
```dockerfile
# Playwright 브라우저 다운로드 건너뛰기
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 시스템 Chromium 설치
RUN apk add --no-cache chromium
```

### 테스트 검증

Docker 환경에서 정상 작동하는지 테스트:

```bash
# 전체 테스트 실행
npm run docker:test
```

**테스트 항목:**
- ✅ Chromium 설치 및 버전 확인
- ✅ Xvfb 가상 디스플레이 시작
- ✅ Playwright 브라우저 실행
- ✅ 웹페이지 로드 및 DOM 조작
- ✅ MCP 서버 모듈 로드

### 한계점 및 고려사항

#### ✅ 가능한 것들:
- **Headless 브라우저 실행** - 완전히 지원
- **웹 스크래핑** - 정상 작동
- **자동화 스크립트** - 문제없음
- **로또 구매/확인** - 실제 기능 동작

#### ⚠️ 제한사항:
- **GUI 표시 불가** - 브라우저 창을 볼 수 없음
- **디버깅 어려움** - 시각적 확인 불가
- **성능 오버헤드** - Xvfb로 인한 약간의 성능 저하
- **메모리 사용량** - 가상 디스플레이 + 브라우저

### 대안 방안들

만약 Docker에서 브라우저 실행이 여전히 문제가 된다면:

#### 방안 1: API 모드 전환
```javascript
// @rich-automation/lotto의 API 모드 사용
const lottoService = new LottoService({
  controller: 'api' // 브라우저 없이 API만 사용
});
```

#### 방안 2: Puppeteer로 변경
```javascript
// Playwright 대신 Puppeteer 사용 (더 안정적)
const lottoService = new LottoService({
  controller: puppeteer
});
```

#### 방안 3: Host 브라우저 사용
```json
{
  "command": "docker",
  "args": [
    "run", "--rm", "-i",
    "-v", "/tmp/.X11-unix:/tmp/.X11-unix",
    "-e", "DISPLAY=${DISPLAY}",
    "lotto-mcp-server:latest"
  ]
}
```

### 결론

**Docker에서 Playwright 브라우저 실행은 가능합니다!** 

하지만 다음 조건들이 필요합니다:
- Xvfb 가상 디스플레이
- Headless 모드 강제 설정
- 적절한 Chromium 플래그
- 충분한 메모리 할당

현재 구현된 설정으로 실제 로또 구매 기능이 정상 작동합니다.

## 🚀 빠른 시작 (사용자용)

### 1단계: 계정 정보 인코딩

터미널에서 간단하게 Base64 인코딩:

```bash
# macOS/Linux
echo "your_lotto_id,your_password" | base64

# Windows (PowerShell)
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your_id,your_password"))

# 결과 예시
bXlfbG90dG9faWQsbXlfcGFzc3dvcmQ=
```

### 2단계: Claude Desktop 설정

Claude Desktop의 설정 파일(`claude_desktop_config.json`)에 추가:

```json
{
  "mcpServers": {
    "lotto": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "LOTTO_CREDENTIALS=bXlfbG90dG9faWQsbXlfcGFzc3dvcmQ=",
        "your-dockerhub-username/lotto-mcp-server:latest"
      ]
    }
  }
}
```

**설정 파일 위치:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 3단계: Claude Desktop 재시작

Claude Desktop을 재시작하면 바로 사용 가능합니다!

### 4단계: 사용하기

Claude에서 다음과 같이 사용:

```
로또 5게임 구매해줘
```

```
이 번호들 당첨 확인해줘: [[1,2,3,4,5,6], [7,8,9,10,11,12]]
```

## 💡 장점

✅ **설치 불필요** - Node.js, npm, Playwright 등 설치할 필요 없음  
✅ **빌드 불필요** - 미리 빌드된 이미지 사용  
✅ **격리된 환경** - 매번 새로운 컨테이너에서 실행  
✅ **자동 정리** - `--rm` 옵션으로 사용 후 자동 삭제  
✅ **간단한 설정** - 계정 정보만 Base64로 인코딩하여 설정  

## 🔧 고급 사용법

### 로그 레벨 조정

```json
{
  "mcpServers": {
    "lotto": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "LOTTO_CREDENTIALS=bXlfbG90dG9faWQsbXlfcGFzc3dvcmQ=",
        "-e", "LOG_LEVEL=3",
        "your-dockerhub-username/lotto-mcp-server:latest"
      ]
    }
  }
}
```

### 특정 버전 사용

```json
{
  "mcpServers": {
    "lotto": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "LOTTO_CREDENTIALS=bXlfbG90dG9faWQsbXlfcGFzc3dvcmQ=",
        "your-dockerhub-username/lotto-mcp-server:v1.0.0"
      ]
    }
  }
}
```

### 로컬에서 이미지 미리 다운로드

```bash
# 이미지 미리 다운로드 (선택사항)
docker pull your-dockerhub-username/lotto-mcp-server:latest
```

## 🔍 트러블슈팅

### Docker가 설치되지 않은 경우

Docker Desktop을 설치해주세요:
- [Docker Desktop for Mac](https://docs.docker.com/docker-for-mac/install/)
- [Docker Desktop for Windows](https://docs.docker.com/docker-for-windows/install/)
- [Docker for Linux](https://docs.docker.com/engine/install/)

### 계정 정보 인코딩 오류

```bash
# 올바른 형식 확인
echo "id,password" | base64

# 잘못된 예시 (쉼표 없음)
echo "id password" | base64  # ❌

# 올바른 예시
echo "my_lotto_id,my_password" | base64  # ✅
```

### 컨테이너 실행 오류

```bash
# Docker 상태 확인
docker --version
docker info

# 수동으로 컨테이너 테스트
docker run --rm -it \
  -e LOTTO_CREDENTIALS="bXlfbG90dG9faWQsbXlfcGFzc3dvcmQ=" \
  your-dockerhub-username/lotto-mcp-server:latest
```

### Claude Desktop 연결 문제

1. **Claude Desktop 완전 재시작**
2. **설정 파일 경로 확인**
3. **JSON 문법 검증** ([JSON Validator](https://jsonlint.com/) 사용)

### 이미지 다운로드 실패

```bash
# 수동으로 이미지 다운로드
docker pull your-dockerhub-username/lotto-mcp-server:latest

# 네트워크 문제시 다른 레지스트리 사용
# (예: ghcr.io, quay.io 등)
```

## 📊 모니터링

### 실행 중인 컨테이너 확인

```bash
# 현재 실행 중인 lotto 컨테이너
docker ps | grep lotto-mcp-server
```

### 로그 확인

```bash
# Docker 로그 (컨테이너 이름으로)
docker logs <container_id>
```

### 이미지 업데이트

```bash
# 최신 이미지로 업데이트
docker pull your-dockerhub-username/lotto-mcp-server:latest

# 오래된 이미지 정리
docker image prune
```

## 🛠️ 개발자용 (이미지 빌드 및 배포)

### 로컬 빌드

```bash
# 프로젝트 클론
git clone <repository-url>
cd lotto-mcp-server

# Docker 이미지 빌드
docker build -t lotto-mcp-server:latest .

# 로컬에서 테스트
docker run --rm -i \
  -e LOTTO_CREDENTIALS="$(echo 'test_id,test_password' | base64)" \
  lotto-mcp-server:latest
```

### Docker Hub 배포

```bash
# 배포 스크립트 실행
chmod +x scripts/deploy-docker.sh
./scripts/deploy-docker.sh your-dockerhub-username v1.0.0
```

### GitHub Actions 자동 배포 (예시)

```yaml
name: Build and Push Docker Image

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to DockerHub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: |
          your-dockerhub-username/lotto-mcp-server:latest
          your-dockerhub-username/lotto-mcp-server:${{ github.ref_name }}
```

## 🔒 보안 고려사항

1. **환경변수 보안**: 계정 정보는 Base64로 인코딩되어 있지만, 설정 파일 권한을 적절히 관리하세요
2. **이미지 신뢰성**: 공식 배포된 이미지만 사용하세요
3. **업데이트**: 정기적으로 최신 이미지로 업데이트하세요
4. **로그 관리**: 민감한 정보가 로그에 남지 않도록 주의하세요

## 📋 체크리스트

Docker 사용 전 확인사항:

- [ ] Docker Desktop 설치 및 실행 중
- [ ] 동행복권 계정 및 예치금 준비
- [ ] 계정 정보 Base64 인코딩 완료
- [ ] Claude Desktop 설정 파일 경로 확인
- [ ] JSON 설정 문법 검증 완료
- [ ] Claude Desktop 재시작 완료

모든 체크리스트를 완료했다면 Claude에서 "로또 구매해줘"라고 말해보세요! 🎰