# MySQL 연결 설정 가이드

## 개요

MySQL을 사용한 인증, API 키, 텍스트 데이터 관리를 위한 백엔드 서버 구조를 준비했습니다.

## 구조

### 백엔드 (`backend/`)
- `config/database.ts`: MySQL 연결 설정
- `config/schema.sql`: 데이터베이스 스키마
- `services/mysqlAuthService.ts`: 인증 서비스
- `services/mysqlApiKeyService.ts`: API 키 관리 서비스
- `services/mysqlTextDataService.ts`: 텍스트 데이터 관리 서비스

### 프론트엔드 (`frontend/src/`)
- `services/mysql/mysqlApiService.ts`: 백엔드 API 호출 클라이언트
- `types/mysql.ts`: MySQL 관련 타입 정의

## 설치 방법

### 1. 백엔드 서버 설정

```bash
# backend 디렉토리 생성 후 이동
cd backend
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일 수정하여 MySQL 설정 입력
```

### 2. MySQL 데이터베이스 생성

```bash
# MySQL 접속
mysql -u root -p

# 스키마 실행
source config/schema.sql
```

### 3. 환경 변수 설정

#### 백엔드 (`backend/.env`)
```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=storyboard_db
JWT_SECRET=your-secret-key
```

#### 프론트엔드 (`frontend/.env`)
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

## 사용 방법

### 프론트엔드에서 사용

```typescript
import { mysqlApiService } from './services/mysql/mysqlApiService';

// 로그인
const { token, user } = await mysqlApiService.login(email, password);

// API 키 저장
await mysqlApiService.saveApiKey('google', apiKey);

// 텍스트 데이터 생성
const textDataId = await mysqlApiService.createTextData({
  category: 'story',
  title: '스토리 제목',
  content: '스토리 내용'
});

// 텍스트 데이터 조회
const textData = await mysqlApiService.getTextData(textDataId);
```

## 다음 단계

1. **백엔드 서버 구현**: Express.js로 API 엔드포인트 구현
2. **인증 미들웨어**: JWT 토큰 기반 인증 미들웨어 구현
3. **API 라우터**: RESTful API 엔드포인트 구현
4. **에러 처리**: 통합 에러 처리 미들웨어
5. **로깅**: 요청/응답 로깅 시스템

## 주의사항

- API 키는 암호화되어 저장됩니다
- 비밀번호는 bcrypt로 해시화됩니다
- JWT 토큰으로 인증을 관리합니다
- 모든 테이블에 외래키 제약 조건이 설정되어 있습니다

