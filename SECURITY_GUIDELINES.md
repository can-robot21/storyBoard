# 🔒 보안 가이드라인

## GitHub 저장소 보안 체크리스트

### ✅ 커밋 전 필수 확인사항

1. **환경변수 파일 확인**
   - [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
   - [ ] `env.example`에 실제 값이 아닌 예시 값만 포함
   - [ ] 실제 API 키나 비밀번호가 코드에 하드코딩되지 않았는지 확인

2. **민감한 정보 검색**
   ```bash
   # API 키 패턴 검색
   grep -r "sk-[a-zA-Z0-9]" . --exclude-dir=node_modules
   
   # 비밀번호 패턴 검색
   grep -r "password.*=" . --exclude-dir=node_modules
   
   # 이메일 주소 검색
   grep -r "@.*\.com" . --exclude-dir=node_modules
   ```

3. **파일 제외 확인**
   - [ ] `node_modules/` 폴더 제외
   - [ ] `build/`, `dist/` 폴더 제외
   - [ ] 로그 파일 제외
   - [ ] 데이터베이스 파일 제외

### 🚨 절대 커밋하면 안 되는 것들

- 실제 API 키 (OpenAI, Google AI, Anthropic 등)
- 관리자 비밀번호
- 데이터베이스 연결 정보
- 실제 이메일 주소
- 개인정보
- 서버 설정 파일

### 🛡️ 보안 모범 사례

1. **환경변수 사용**
   ```typescript
   // ❌ 잘못된 방법
   const apiKey = "sk-1234567890abcdef";
   
   // ✅ 올바른 방법
   const apiKey = process.env.REACT_APP_API_KEY;
   ```

2. **예시 파일 사용**
   ```bash
   # env.example 파일에 예시 값만 포함
   REACT_APP_API_KEY=your-api-key-here
   REACT_APP_ADMIN_EMAIL=admin@example.com
   ```

3. **코드 검토**
   - 커밋 전 코드 리뷰 수행
   - 자동화된 보안 스캔 도구 사용
   - 정기적인 의존성 업데이트

### 🔧 보안 도구 설정

1. **GitHub CodeQL 활성화**
   - Repository Settings > Security > Code scanning
   - 자동 보안 취약점 검사

2. **Dependabot 활성화**
   - Repository Settings > Security > Dependabot alerts
   - 의존성 보안 업데이트 자동화

3. **Branch Protection Rules**
   - main 브랜치 보호 설정
   - Pull Request 필수 검토

### 📋 긴급 상황 대응

만약 실수로 민감한 정보를 커밋했다면:

1. **즉시 조치**
   ```bash
   # 커밋 히스토리에서 파일 제거
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   --prune-empty --tag-name-filter cat -- --all
   
   # 강제 푸시 (주의: 팀원들과 협의 필요)
   git push origin --force --all
   ```

2. **API 키 교체**
   - 노출된 API 키 즉시 삭제/교체
   - 새로운 API 키 생성 및 배포

3. **팀 알림**
   - 팀원들에게 보안 사고 알림
   - 재발 방지 대책 수립

### 📞 연락처

보안 관련 문의: security@star612.net
긴급 보안 사고: emergency@star612.net