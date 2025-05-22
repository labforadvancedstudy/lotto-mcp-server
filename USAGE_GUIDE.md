# 🎰 로또 MCP 서버 사용 가이드

Docker를 사용하여 별도 설치 없이 바로 로또를 구매할 수 있습니다!

## 🚀 3단계로 시작하기

### 1단계: 계정 정보 인코딩 

터미널에서 다음 명령어 실행:

```bash
# macOS/Linux
echo "동행복권ID,동행복권패스워드" | base64

# Windows (PowerShell)
[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("동행복권ID,동행복권패스워드"))
```

**예시:**
```bash
echo "lotto123,mypassword" | base64
# 결과: bG90dG8xMjMsbXlwYXNzd29yZA==
```

### 2단계: Claude Desktop 설정

Claude Desktop 설정 파일에 다음을 추가:

**설정 파일 위치:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

**설정 내용:**
```json
{
  "mcpServers": {
    "lotto": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-e", "LOTTO_CREDENTIALS=bG90dG8xMjMsbXlwYXNzd29yZA==",
        "your-dockerhub-username/lotto-mcp-server:latest"
      ]
    }
  }
}
```

> ⚠️ `LOTTO_CREDENTIALS=` 뒤에 1단계에서 생성한 Base64 문자열을 넣으세요!

### 3단계: Claude Desktop 재시작

Claude Desktop을 완전히 종료했다가 다시 실행하세요.

## 🎯 사용하기

Claude에서 다음과 같이 말하면 됩니다:

```
로또 5게임 구매해줘
```

```
이 번호들 당첨 확인해줘: [[1,2,3,4,5,6], [7,8,9,10,11,12]]
```

## 💡 주요 장점

✅ **설치 불필요** - Node.js, npm 등 아무것도 설치할 필요 없음  
✅ **빌드 불필요** - 미리 만들어진 Docker 이미지 사용  
✅ **안전한 격리** - 매번 새로운 환경에서 실행  
✅ **자동 정리** - 사용 후 자동으로 삭제됨  

## 🔍 문제 해결

### Docker가 없다고 나오는 경우

Docker Desktop을 설치하세요:
- [Mac용 Docker Desktop](https://docs.docker.com/docker-for-mac/install/)
- [Windows용 Docker Desktop](https://docs.docker.com/docker-for-windows/install/)

### 계정 정보가 틀렸다고 나오는 경우

1. **형식 확인**: `ID,패스워드` 형태로 쉼표가 있는지 확인
2. **실제 로그인 테스트**: 동행복권 사이트에서 직접 로그인 테스트
3. **재인코딩**: 1단계를 다시 수행

### Claude Desktop에서 인식이 안 되는 경우

1. **설정 파일 위치 확인**
2. **JSON 문법 검증**: [JSON 검증 사이트](https://jsonlint.com/) 사용
3. **완전 재시작**: Claude Desktop 완전 종료 후 재실행

### 구매가 안 되는 경우

1. **예치금 확인**: 동행복권 계정에 충분한 잔액이 있는지 확인
2. **서비스 시간 확인**: 토요일 밤 11시 ~ 일요일 오후 6시는 서비스 중단
3. **계정 상태 확인**: 계정이 정지되지 않았는지 확인

## 📋 체크리스트

사용 전 다음을 확인하세요:

- [ ] Docker Desktop 설치 및 실행 중
- [ ] 동행복권 계정 및 예치금 준비
- [ ] 계정 정보 올바른 형식으로 Base64 인코딩 (`ID,패스워드`)
- [ ] Claude Desktop 설정 파일에 올바른 설정 추가
- [ ] Claude Desktop 재시작 완료

모든 체크리스트를 완료했다면 Claude에서 "로또 3게임 구매해줘"라고 말해보세요! 🎰

## 🔒 보안 안내

- Base64는 간단한 인코딩으로 암호화가 아닙니다
- 설정 파일을 다른 사람과 공유하지 마세요
- 정기적으로 동행복권 계정 패스워드를 변경하세요

---

**🎯 이제 Claude와 함께 로또의 행운을 잡아보세요!**