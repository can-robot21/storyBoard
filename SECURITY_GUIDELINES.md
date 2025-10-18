# 🔒 API 키 보안 가이드라인

## ⚠️ 중요 보안 알림

**2025년 1월 27일**: Google Cloud Platform에서 공개적으로 노출된 API 키가 감지되었습니다.

### 🚨 발생한 문제
- **API 키**: `AIzaSyDjHf_s-Tdr8gH8kb5spxDm_kg5XYD8pQs`
- **프로젝트**: star612-tutor
- **노출 위치**: GitHub 공개 저장소
- **파일**: `frontend/src/services/googleAIService.ts`

### ✅ 즉시 조치 완료
1. **API 키 제거**: 소스 코드에서 하드코딩된 API 키 제거
2. **환경 변수 사용**: `process.env.REACT_APP_GEMINI_API_KEY`로 변경
3. **보안 문서 작성**: 이 가이드라인 문서 생성

## 🛡️ API 키 보안 원칙

### 1. 절대 하드코딩 금지
```typescript
// ❌ 잘못된 방법 - 절대 사용 금지
const apiKey = 'AIzaSyDjHf_s-Tdr8gH8kb5spxDm_kg5XYD8pQs';

// ✅ 올바른 방법
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
```

### 2. 환경 변수 사용
```bash
# .env 파일 (Git에 커밋하지 않음)
REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
```

### 3. .gitignore 설정
```gitignore
# 환경 변수 파일 제외
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# API 키 관련 파일
*.key
*.pem
secrets/
```

## 🔧 개발 환경 설정

### 1. 로컬 개발
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일에 실제 API 키 입력
echo "REACT_APP_GEMINI_API_KEY=your_actual_key" >> .env
```

### 2. 프로덕션 배포
- 환경 변수를 배포 플랫폼에서 설정
- 절대 소스 코드에 API 키 포함하지 않음

## 🚫 금지사항

### 1. 소스 코드에 API 키 포함
- 하드코딩된 API 키
- 주석에 API 키 포함
- 설정 파일에 평문 API 키

### 2. 공개 저장소에 민감 정보 업로드
- GitHub 공개 저장소
- 공개 웹사이트
- 소셜 미디어

### 3. API 키 공유
- 이메일로 전송
- 채팅 메시지
- 화면 공유

## ✅ 권장사항

### 1. API 키 관리
- 정기적인 키 로테이션
- 사용하지 않는 키 삭제
- API 키 제한사항 설정

### 2. 코드 리뷰
- 모든 커밋에서 API 키 검사
- 자동화된 보안 스캔 도구 사용
- 팀원 간 코드 리뷰 필수

### 3. 모니터링
- Google Cloud Console에서 사용량 모니터링
- 비정상적인 사용량 알림 설정
- 정기적인 보안 감사

## 🔍 보안 체크리스트

### 개발 전
- [ ] API 키가 환경 변수로 설정되어 있는가?
- [ ] .env 파일이 .gitignore에 포함되어 있는가?
- [ ] 소스 코드에 하드코딩된 키가 없는가?

### 커밋 전
- [ ] API 키가 포함된 파일이 없는가?
- [ ] 민감한 정보가 주석에 없는가?
- [ ] 설정 파일에 평문 키가 없는가?

### 배포 전
- [ ] 프로덕션 환경 변수가 설정되어 있는가?
- [ ] API 키 제한사항이 설정되어 있는가?
- [ ] 사용량 모니터링이 활성화되어 있는가?

## 🆘 보안 사고 대응

### 1. 즉시 조치
1. **API 키 교체**: Google Cloud Console에서 새 키 생성
2. **노출된 키 삭제**: 기존 키 즉시 삭제
3. **코드 수정**: 소스 코드에서 키 제거
4. **재배포**: 수정된 코드 즉시 배포

### 2. 사후 조치
1. **사용량 검토**: 비정상적인 사용량 확인
2. **보안 감사**: 전체 코드베이스 보안 검사
3. **팀 교육**: 보안 가이드라인 재교육
4. **프로세스 개선**: 보안 프로세스 강화

## 📞 연락처

### 보안 문제 신고
- **이메일**: security@star612.net
- **긴급 연락**: 즉시 프로젝트 관리자에게 연락

### Google Cloud 지원
- **콘솔**: https://console.cloud.google.com/
- **문서**: https://cloud.google.com/docs/security

---

**⚠️ 주의**: 이 문서는 프로젝트의 모든 개발자가 숙지하고 준수해야 합니다. 보안 위반 시 심각한 결과를 초래할 수 있습니다.

**최종 업데이트**: 2025년 1월 27일  
**문서 버전**: 1.0  
**작성자**: AI Assistant (Claude)
