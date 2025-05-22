# 멀티스테이지 빌드 사용
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY tsconfig.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY src/ ./src/

# TypeScript 빌드를 위한 개발 의존성 설치
RUN npm install --save-dev typescript tsx @types/node

# 프로젝트 빌드
RUN npm run build

# 프로덕션 이미지
FROM node:18-alpine AS runtime

# 시스템 의존성 및 Chromium 설치
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    xvfb \
    dbus \
    && rm -rf /var/cache/apk/*

# 가상 디스플레이를 위한 Xvfb 설정
ENV DISPLAY=:99

# Playwright/Puppeteer가 시스템 Chromium을 사용하도록 설정
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROMIUM_FLAGS="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage --disable-web-security --disable-features=VizDisplayCompositor"

# 작업 디렉토리 설정
WORKDIR /app

# package.json 복사 (런타임 의존성만)
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일 복사
COPY --from=builder /app/dist ./dist

# 사용자 권한 설정 (보안)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# nodejs 사용자로 소유권 변경
RUN chown -R nodejs:nodejs /app

# Chromium 실행 권한 설정
RUN chmod 4755 /usr/bin/chromium-browser

USER nodejs

# 엔트리포인트 스크립트 생성
COPY --chown=nodejs:nodejs <<EOF /app/entrypoint.sh
#!/bin/sh

# Xvfb 가상 디스플레이 시작
Xvfb :99 -screen 0 1024x768x24 -nolisten tcp &
XVFB_PID=\$!

# 신호 처리 함수
cleanup() {
    echo "Shutting down..."
    kill \$XVFB_PID 2>/dev/null
    exit 0
}

# 신호 트랩 설정
trap cleanup TERM INT

# 메인 애플리케이션 실행
node dist/index.js &
APP_PID=\$!

# 애플리케이션 대기
wait \$APP_PID
cleanup
EOF

RUN chmod +x /app/entrypoint.sh

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD pgrep -f "node dist/index.js" > /dev/null || exit 1

# 애플리케이션 실행
ENTRYPOINT ["/app/entrypoint.sh"]