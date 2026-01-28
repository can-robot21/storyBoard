# StoryBoard Setup 가이드 (환경설정 및 MySQL)

**V1.4** | StoryBoard 백엔드·DB 환경설정 및 실행 가이드

Trading Service와 동일한 localhost 서버에서 MySQL을 사용합니다.

### 1단계: MySQL 설정 (1회만 실행)

```bash
cd /mnt/coding/storyBoard/backend
./scripts/setup-mysql-localhost.sh
```

**무엇을 하나요?**
- MySQL root 비밀번호 제거 (localhost 전용)
- storyboard_db 데이터베이스 생성
- storyboard_user 사용자 생성 및 권한 부여
- 자동 연결 테스트

**예상 시간:** 약 5~10초

---

### 2단계: 연결 테스트

```bash
# 프로젝트 루트에서
npm run test:db

# 또는 backend에서
cd backend
npm run test:db
```

**성공 시 출력:**
```
✅ 모든 테스트 통과!

📋 생성된 내용:
   ✓ MySQL Root 비밀번호 제거 (localhost 전용)
   ✓ storyboard_db 데이터베이스
   ✓ storyboard_user 사용자
   ✓ 모든 권한 부여
```

---

### 3단계: 마이그레이션 실행

```bash
# 프로젝트 루트에서
npm run migrate

# 또는 backend에서
cd backend
npm run migrate
```

---

### 4단계: 서버 실행

```bash
# 전체 실행 (프론트엔드 + 백엔드)
npm run dev

# 백엔드만 실행
npm run dev:backend

# 프로덕션 모드
npm start
```

---

## 📋 환경 설정

### backend/.env 파일

`backend/.env` 파일이 다음과 같이 설정되어 있어야 합니다.

#### 데이터베이스 (MariaDB/MySQL)

```env
# Database Configuration (MariaDB/MySQL)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=storyboard_db
MYSQL_USER=storyboard_user
MYSQL_PASSWORD=storyboard_password_123
MYSQL_CONNECTION_LIMIT=10
```

#### 서버·프론트 연동

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
```

#### 인증 (Google OAuth 등)

```env
JWT_SECRET=change_this_secret
GOOGLE_OAUTH_CLIENT_ID=your_google_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_CALLBACK_URL=http://localhost:3001/auth/google/callback
```

#### AI·이미지 생성 (필요 시)

```env
# Google AI / Gemini (이미지·텍스트 생성)
VITE_GOOGLE_AI_API_KEY=your_api_key_here
VITE_GEMINI_API_KEY=your_api_key_here
```

- **프로덕션**에서는 `NODE_ENV=production`, `FRONTEND_URL`·`CORS_ORIGINS`·`GOOGLE_OAUTH_CALLBACK_URL`을 실제 도메인으로 변경하세요.

### Trading Service와 함께 사용

동일한 localhost 서버에서 다음 서비스가 실행됩니다:

| 서비스 | 데이터베이스 | 포트 | 데이터베이스명 |
|--------|-------------|------|---------------|
| Trading Service | MongoDB | 27017 | star612 |
| StoryBoard | MySQL | 3306 | storyboard_db |
| StoryBoard Backend | Express | 3001 | - |
| StoryBoard Frontend | React | 3000 | - |

---

## 🔧 문제 해결

### "Access Denied" 에러

```bash
cd /mnt/coding/storyBoard/backend
./scripts/setup-mysql-localhost.sh
```

위 명령어가 실패하면:

```bash
# 방법 1: debian-sys-maint 사용
./scripts/fix-mysql-debian.sh

# 방법 2: 안전 모드 사용
./scripts/fix-mysql-root.sh
```

### MySQL 서비스 확인

```bash
# 서비스 상태 확인
systemctl is-active mysql

# 서비스 시작
sudo systemctl start mysql

# 서비스 재시작
sudo systemctl restart mysql
```

### 연결 테스트 명령어

```bash
# 1. MySQL CLI로 직접 연결
mysql -u storyboard_user -p'storyboard_password_123' \
  -e "SELECT 'OK' as status;"

# 2. Node.js 스크립트로 테스트
npm run test:db

# 3. 데이터베이스 목록 확인
mysql -u storyboard_user -p'storyboard_password_123' \
  -e "SHOW DATABASES;"
```

---

## 📝 사용 가능한 npm 스크립트

### Backend (backend/ 디렉토리)

```bash
npm run dev          # 개발 서버 (hot reload)
npm run build        # TypeScript 빌드
npm start            # 프로덕션 서버
npm run migrate      # 마이그레이션 실행
npm run migrate:check # 마이그레이션 상태 확인
npm run setup-db     # 데이터베이스 초기 설정
npm run test:db      # 연결 테스트
```

### 루트 디렉토리

```bash
npm run dev                # 전체 개발 서버 (프론트 + 백엔드)
npm run dev:backend        # 백엔드만 개발 서버
npm run dev:frontend       # 프론트엔드만 개발 서버
npm run build              # 전체 빌드
npm start                  # 전체 프로덕션 서버
npm run migrate            # 마이그레이션
npm run test:db            # 연결 테스트
npm run install:all        # 모든 의존성 설치
```

---

## 🚀 처음 설치하는 경우

```bash
# 1. 프로젝트 클론 (이미 완료됨)
cd /mnt/coding/storyBoard

# 2. 의존성 설치
npm run install:all

# 3. .env 파일 설정
cd backend
cp .env.example .env
nano .env  # 필요한 값 수정

# 4. MySQL 설정
./scripts/setup-mysql-localhost.sh

# 5. 연결 테스트
npm run test:db

# 6. 마이그레이션
cd ..
npm run migrate

# 7. 개발 서버 실행
npm run dev
```

---

## 📚 추가 문서

- `backend/scripts/FIX_ACCESS_DENIED.md` - Access Denied 에러 해결
- `backend/scripts/README_SETUP.md` - 상세 설정 가이드
- `CLAUDE.md` - 프로젝트 개발 규칙

---

## ✅ 체크리스트

설치 완료 확인:

- [ ] MySQL 서비스 실행 중
- [ ] storyboard_user 생성됨
- [ ] storyboard_db 데이터베이스 생성됨
- [ ] .env 파일 설정 완료
- [ ] `npm run test:db` 성공
- [ ] `npm run migrate` 성공
- [ ] `npm run dev` 실행 가능

---

## 📄 버전 및 참고

| 항목 | 값 |
|------|-----|
| **문서 버전** | V1.4 |
| **최종 업데이트** | 2025-01-28 |
| **개발자** | star612.net@gmail.com / can.robot21@gmail.com |
| **환경** | Ubuntu/Debian, MySQL/MariaDB, Node.js 18+ |
