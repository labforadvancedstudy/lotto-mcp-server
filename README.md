# 로또 MCP 서버

동행복권에서 로또를 자동으로 구매하고 당첨 결과를 확인할 수 있는 MCP(Model Context Protocol) 서버입니다.

## 📋 기능

- **로또 자동 구매**: 동행복권 계정으로 로그인하여 로또를 자동으로 구매
- **당첨 결과 확인**: 구매한 로또 번호의 당첨 결과를 자동으로 확인
- **보안 강화**: ID/패스워드를 암호화하여 안전하게 저장
- **Docker 지원**: 별도 설치 없이 Docker로 바로 실행 가능

## 🚀 설치 및 실행 방법

### 방법 1: npx 사용 (추천) ⚡

```bash
# 계정 설정 도우미
npx @labforadvanced.study/lotto-mcp-server --setup

# 또는 직접 인코딩
echo "your_id,your_password" | base64
```

**Claude Desktop 설정:**
```json
{
  "mcpServers": {
    "lotto": {
      "command": "npx",
      "args": ["@labforadvanced.study/lotto-mcp-server"],
      "env": {
        "LOTTO_CREDENTIALS": "your_base64_credentials"
      }
    }
  }
}
```

자세한 npm 사용법은 [NPM_GUIDE.md](NPM_GUIDE.md)를 참고하세요.

### 방법 2: Docker 사용 🐳

별도 설치나 빌드 없이 배포된 Docker 이미지를 바로 사용할 수 있습니다!

#### 1단계: 계정 정보 인코딩

터미널에서 간단하게 인코딩:

```bash
# macOS/Linux
echo "your_lotto_id,your_password" | base64

# Windows (PowerShell)
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your_id,your_password"))

# 결과 예시: bXlfbG90dG9faWQsbXlfcGFzc3dvcmQ=
```

#### 2단계: Claude Desktop 설정

`claude_desktop_config.json` 파일에 다음 설정을 추가:

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

#### 3단계: Claude Desktop 재시작

Claude Desktop을 재시작하면 바로 사용 가능합니다!

```
로또 3게임 구매해줘
```

### 방법 3: 로컬 설치

#### 2-1. 필수 조건

- Node.js 18.0.0 이상
- 동행복권 계정 (미리 예치금 충전 필요)

#### 2-2. 설치

```bash
# 의존성 설치
npm install

# Playwright 브라우저 설치
npm run install-playwright

# 빌드
npm run build
```

### 3. 계정 정보 설정 (두 가지 방법)

#### 방법 1: 간단 모드 (Base64 인코딩) - 추천 ⭐

```bash
# 방법 1-A: 인터랙티브 도구 사용
npm run encrypt-credentials
# 선택: 1 (간단 모드)

# 방법 1-B: 간단 스크립트 사용
npm run simple-encode

# 방법 1-C: 터미널에서 직접
echo "your_id,your_password" | base64
```

**출력 예시:**
```json
{
  "mcpServers": {
    "lotto": {
      "command": "node",
      "args": ["path/to/lotto-mcp-server/dist/index.js"],
      "env": {
        "LOTTO_CREDENTIALS": "eW91cl9pZCx5b3VyX3Bhc3N3b3Jk"
      }
    }
  }
}
```

#### 방법 2: 고급 모드 (AES 암호화)

```bash
npm run encrypt-credentials
# 선택: 2 (고급 모드)
```

**출력 예시:**
```json
{
  "mcpServers": {
    "lotto": {
      "command": "node",
      "args": ["path/to/lotto-mcp-server/dist/index.js"],
      "env": {
        "LOTTO_ENCRYPTED_ID": "YWJjZGVmZ2hpams...",
        "LOTTO_ENCRYPTED_PASSWORD": "bXlwYXNzd29yZA...",
        "LOTTO_SECRET_KEY": "optional-custom-key"
      }
    }
  }
}
```

### 4. Claude Desktop 설정

1. 위에서 생성된 설정을 `claude_desktop_config.json` 파일에 복사
2. `"path/to/lotto-mcp-server/dist/index.js"`를 실제 경로로 변경
3. Claude Desktop 재시작

### 5. 개발 모드 실행

```bash
npm run dev
```

### 6. 프로덕션 실행

```bash
npm start
```

## 🛠️ 사용법

이 MCP 서버는 다음 두 가지 도구를 제공합니다:

### 1. `purchase_lotto` - 로또 구매

동행복권에서 로또를 자동으로 구매합니다. **ID/패스워드는 설정에서 자동으로 가져옵니다.**

**입력 파라미터:**
- `count` (number): 구매할 로또 게임 수 (1-5)

**출력 예시:**
```json
{
  "success": true,
  "numbers": [
    [1, 14, 21, 27, 30, 44],
    [4, 5, 27, 29, 40, 44],
    [9, 18, 19, 24, 38, 42]
  ],
  "message": "3게임을 성공적으로 구매했습니다."
}
```

### 2. `check_lotto_winning` - 당첨 확인

로또 번호의 당첨 결과를 확인합니다.

**입력 파라미터:**
- `numbers` (array): 확인할 로또 번호 배열 (예: [[1,2,3,4,5,6], [7,8,9,10,11,12]])
- `round` (number, 선택사항): 확인할 회차 (기본값: 현재 회차)

**출력 예시:**
```json
{
  "success": true,
  "results": [
    {
      "numbers": [1, 2, 3, 4, 5, 6],
      "rank": 5,
      "matchedNumbers": [1, 2, 3]
    },
    {
      "numbers": [7, 8, 9, 10, 11, 12],
      "rank": 0,
      "matchedNumbers": []
    }
  ],
  "message": "1143회차 당첨 결과를 확인했습니다."
}
```

## 💡 MCP 클라이언트에서 사용하기

### Claude Desktop에서 사용

설정 완료 후 Claude에서 다음과 같이 사용:

```
로또 3게임 구매해줘
```

```
이 로또 번호들 당첨 확인해줘: [[1,2,3,4,5,6], [7,8,9,10,11,12]]
```

## 🔐 보안 기능

### 간단 모드 (Base64) - 추천
- 터미널에서 `echo "id,password" | base64`로 간단 생성
- raw 패스워드가 그대로 노출되지 않음
- 설정 파일에서 패스워드 직접 확인 불가
- 대부분 사용자에게 충분한 보안 수준

### 고급 모드 (AES 암호화)
- AES-256-CBC 대칭 암호화
- 사용자 정의 암호화 키 지원
- Base64 추가 인코딩으로 보안층 강화
- 고급 보안이 필요한 경우 사용

### 터미널에서 직접 생성하기

간단 모드를 터미널에서 직접 생성할 수 있습니다:

```bash
# macOS/Linux
echo "your_id,your_password" | base64

# Windows (PowerShell)
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("your_id,your_password"))
```

### 보안 수준 비교

| 방식 | 보안 수준 | 편의성 | 사용 상황 |
|------|-----------|--------|-----------|
| 간단 모드 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 일반 사용자, 개인 PC |
| 고급 모드 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 민감한 환경, 공용 PC |

## ⚠️ 주의사항

1. **예치금 충전**: 구매 전에 동행복권 계정에 충분한 예치금을 미리 충전해두어야 합니다.
2. **계정 보안**: 암호화된 계정 정보와 시크릿 키를 안전하게 관리하세요.
3. **구매 한도**: 한 번에 최대 5게임까지만 구매 가능합니다.
4. **당첨 번호**: 로또 번호는 1~45 사이의 숫자 6개여야 합니다.
5. **브라우저 자원**: Playwright가 Chromium을 실행하므로 시스템 리소스를 사용합니다.

## 🔧 설정 옵션

`src/lotto-service.ts` 파일에서 다음 옵션을 수정할 수 있습니다:

```typescript
this.lottoService = new BaseLottoService({
  controller: chromium,
  headless: true,              // false로 변경하면 브라우저 창이 보임
  defaultViewport: { 
    width: 1280, 
    height: 720 
  },
  logLevel: 2                  // 로그 레벨 (0: ERROR, 1: WARN, 2: INFO, 3: DEBUG)
});
```

## 📁 프로젝트 구조

```
lotto-mcp-server/
├── src/
│   ├── index.ts              # MCP 서버 메인 파일
│   ├── lotto-service.ts      # 로또 서비스 클래스
│   ├── crypto-utils.ts       # 암호화/복호화 유틸리티
│   └── encrypt-credentials.ts # 계정 정보 인코딩 도구
├── scripts/
│   └── simple-encode.sh      # 간단 인코딩 스크립트
├── dist/                     # 빌드 결과물
├── package.json
├── tsconfig.json
└── README.md
```

## 🐛 문제 해결

### 브라우저 설치 오류
```bash
# Playwright 브라우저 재설치
npx playwright install chromium
```

### 계정 정보 오류
```bash
# 간단 모드로 재설정
npm run simple-encode

# 또는 고급 모드로 재설정
npm run encrypt-credentials
```

### 로그인 실패
- ID와 패스워드가 정확한지 확인
- 동행복권 사이트에 직접 로그인해서 계정 상태 확인
- 보안 설정으로 인한 로그인 제한 여부 확인

### 구매 실패
- 계정에 충분한 예치금이 있는지 확인
- 동행복권 사이트의 서비스 시간 확인 (토요일 밤~일요일 오후는 서비스 중단)

## 📄 라이선스

MIT License

## 🤝 기여

버그 리포트나 기능 제안은 이슈로 등록해주세요.

## ⚖️ 법적 고지

이 도구는 동행복권의 공식 API를 사용하지 않고 웹 스크래핑을 통해 작동합니다. 사용에 따른 모든 책임은 사용자에게 있으며, 과도한 사용으로 인한 계정 제재나 기타 문제에 대해서는 책임지지 않습니다.