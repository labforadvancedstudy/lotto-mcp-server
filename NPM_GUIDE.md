# 📦 npm 패키지 배포 가이드

npm에 패키지를 배포하여 `npx`로 실행할 수 있도록 하는 전체 과정을 안내합니다.

## 🚀 배포 과정

### 1단계: npm 계정 준비

#### npm 계정 생성
1. [npmjs.com](https://www.npmjs.com) 방문
2. "Sign Up" 클릭하여 계정 생성
3. 이메일 인증 완료

#### 로컬에서 로그인
```bash
npm login
# Username, Password, Email 입력
# OTP가 설정된 경우 인증 코드 입력
```

### 2단계: package.json 설정

중요한 필드들을 확인하고 수정:

```json
{
  "name": "@your-username/lotto-mcp-server",
  "version": "1.0.0",
  "bin": {
    "lotto-mcp": "bin/lotto-mcp.js"
  },
  "files": [
    "dist/**/*",
    "bin/**/*"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

**중요 사항:**
- `name`: `@your-username/`를 실제 npm 사용자명으로 변경
- `bin`: 실행 가능한 명령어 정의
- `files`: 배포에 포함할 파일들
- `publishConfig.access`: scoped 패키지는 "public" 필요

### 3단계: 로컬 테스트

배포 전에 로컬에서 철저히 테스트:

```bash
# 자동 테스트 실행
npm run npm:test
```

**테스트 내용:**
- ✅ npm link - 글로벌 명령어 등록
- ✅ npm pack - 패키지 파일 생성  
- ✅ npx 실행 - 명령어 실행
- ✅ MCP 서버 - 기본 기능 로드
- ✅ Claude Desktop - 설정 파일 유효성

### 4단계: 배포 실행

```bash
# 배포 가이드 스크립트 실행
npm run npm:publish
```

**배포 옵션:**
1. **테스트 배포** (`--dry-run`) - 실제로 배포하지 않고 시뮬레이션
2. **베타 배포** (`--tag beta`) - 베타 버전으로 배포
3. **정식 배포** - 최신 버전으로 배포

## 📋 수동 배포 명령어

### 테스트 배포
```bash
npm run build
npm publish --dry-run
```

### 베타 배포
```bash
npm run build  
npm publish --tag beta
```

### 정식 배포
```bash
npm run build
npm publish
```

## 🎯 사용자 사용법

배포 후 사용자들이 다음과 같이 사용 가능:

### 계정 설정
```bash
npx @your-username/lotto-mcp-server --setup
```

### Claude Desktop 설정
```json
{
  "mcpServers": {
    "lotto": {
      "command": "npx",
      "args": ["@your-username/lotto-mcp-server"],
      "env": {
        "LOTTO_CREDENTIALS": "base64_encoded_credentials"
      }
    }
  }
}
```

### 도움말 확인
```bash
npx @your-username/lotto-mcp-server --help
```

## 🔍 버전 관리

### 버전 업데이트
```bash
# 패치 버전 (1.0.0 → 1.0.1)
npm version patch

# 마이너 버전 (1.0.0 → 1.1.0)  
npm version minor

# 메이저 버전 (1.0.0 → 2.0.0)
npm version major
```

### 태그 관리
```bash
# 베타 버전 배포
npm publish --tag beta

# 베타 → latest 승격
npm dist-tag add @your-username/lotto-mcp-server@1.0.1 latest
```

## 🛠️ 트러블슈팅

### 패키지명 충돌
```
npm ERR! 403 Package name too similar to existing package
```
**해결:** 패키지명을 더 유니크하게 변경

### 권한 오류
```
npm ERR! 403 You do not have permission to publish
```
**해결:** 
1. npm 로그인 상태 확인: `npm whoami`
2. 패키지 소유권 확인
3. scoped 패키지인 경우 `publishConfig.access: "public"` 추가

### 빌드 파일 누락
```
npm WARN tar ENOENT: no such file or directory dist/index.js
```
**해결:** `npm run build` 실행 후 배포

### bin 파일 실행 권한
```
permission denied: lotto-mcp
```
**해결:** `chmod +x bin/lotto-mcp.js`

## 📊 배포 상태 확인

### npm 웹사이트
```
https://www.npmjs.com/package/@your-username/lotto-mcp-server
```

### 명령어로 확인
```bash
# 패키지 정보
npm view @your-username/lotto-mcp-server

# 다운로드 통계
npm view @your-username/lotto-mcp-server --json

# 버전 목록
npm view @your-username/lotto-mcp-server versions --json
```

## 🔄 지속적 배포 (CI/CD)

### GitHub Actions 예시
```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        registry-url: 'https://registry.npmjs.org'
    
    - run: npm ci
    - run: npm run build
    - run: npm publish
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 💡 모범 사례

### 1. Semantic Versioning
- **MAJOR**: 호환성을 깨는 변경
- **MINOR**: 새로운 기능 추가
- **PATCH**: 버그 수정

### 2. 문서화
- README.md 업데이트
- CHANGELOG.md 유지
- JSDoc 주석 추가

### 3. 테스트
- 배포 전 철저한 로컬 테스트
- CI/CD에서 자동 테스트
- 사용자 시나리오 검증

### 4. 보안
- `.npmignore` 파일로 민감한 파일 제외
- `npm audit` 정기 실행
- 의존성 업데이트

## 🎉 배포 완료 후

1. **문서 업데이트**: README에 설치 방법 추가
2. **커뮤니티 공유**: 관련 포럼, SNS에 공유
3. **피드백 수집**: 사용자 의견 수렴
4. **지속적 개선**: 버그 수정 및 기능 추가

npm 패키지로 배포하면 사용자들이 간단한 `npx` 명령어 하나로 바로 사용할 수 있습니다! 🚀