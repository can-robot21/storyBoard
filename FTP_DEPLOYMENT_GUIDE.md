# 🚀 FTP 서버 업데이트 절차

## 1. 빌드 파일 확인 ✅

빌드가 성공적으로 완료되었습니다:
- **빌드 위치**: `frontend/build/` 폴더
- **주요 파일들**:
  - `index.html` - 메인 HTML 파일
  - `static/js/main.*.js` - 메인 JavaScript 번들
  - `static/css/main.*.css` - 메인 CSS 파일
  - `static/js/106.*.chunk.js` - 추가 JavaScript 청크
  - `static/js/453.*.chunk.js` - 추가 JavaScript 청크

## 2. FTP 업로드 절차

### 📋 **업로드할 파일 목록**

```
frontend/build/
├── index.html                    # 메인 HTML (업데이트됨)
├── manifest.json                 # PWA 매니페스트 (업데이트됨)
├── favicon.ico                   # 파비콘
├── logo192.png                   # 로고
├── logo512.png                   # 로고
├── robots.txt                    # 검색엔진 설정
├── static/
│   ├── css/
│   │   └── main.*.css           # 메인 CSS (새로 생성됨)
│   └── js/
│       ├── main.*.js             # 메인 JS (새로 생성됨)
│       ├── 106.*.chunk.js       # 청크 JS
│       └── 453.*.chunk.js       # 청크 JS
└── images/                       # 이미지 파일들
    └── banner/                   # 배너 이미지들
        ├── a001.jpg ~ a009.jpg
        ├── d03.jpg
        ├── ing1.mp4
        └── ing2.mp4
```

### 🔧 **FTP 클라이언트 설정**

#### **FileZilla 사용 시**:
1. **호스트**: `ftp.star612.net` (또는 서버 IP)
2. **포트**: `21` (또는 `22` for SFTP)
3. **프로토콜**: FTP 또는 SFTP
4. **사용자명**: 서버 계정명
5. **비밀번호**: 서버 비밀번호

#### **Windows 탐색기 사용 시**:
```
ftp://username:password@ftp.star612.net
```

### 📤 **업로드 순서**

#### **1단계: 기존 파일 백업**
```bash
# 서버에서 기존 파일 백업
cp -r /var/www/html /var/www/html_backup_$(date +%Y%m%d)
```

#### **2단계: 새 파일 업로드**
1. **HTML 파일 업로드**:
   - `build/index.html` → 서버 루트 디렉토리
   - `build/manifest.json` → 서버 루트 디렉토리

2. **정적 파일 업로드**:
   - `build/static/` 전체 폴더 → 서버의 `static/` 폴더
   - 기존 `static/` 폴더 덮어쓰기

3. **이미지 파일 업로드**:
   - `build/images/` 전체 폴더 → 서버의 `images/` 폴더

#### **3단계: 권한 설정**
```bash
# 서버에서 실행
chmod -R 755 /var/www/html/
chown -R www-data:www-data /var/www/html/
```

### 🌐 **웹 서버 설정 확인**

#### **Apache 설정**:
```apache
<VirtualHost *:80>
    ServerName star612.net
    DocumentRoot /var/www/html
    
    # SPA 라우팅을 위한 설정
    <Directory /var/www/html>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
        
        # React Router 지원
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

#### **Nginx 설정**:
```nginx
server {
    listen 80;
    server_name star612.net;
    root /var/www/html;
    index index.html;

    # React Router 지원
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 정적 파일 캐싱
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 🔍 **업데이트 후 확인사항**

#### **1. 기본 기능 테스트**:
- [ ] 홈페이지 로딩 확인
- [ ] 슬라이더 동작 확인
- [ ] 페이지 간 이동 확인
- [ ] 반응형 디자인 확인

#### **2. SEO 확인**:
- [ ] 페이지 타이틀 변경 확인
- [ ] 메타 태그 적용 확인
- [ ] 구조화된 데이터 확인

#### **3. 성능 확인**:
- [ ] 페이지 로딩 속도
- [ ] 이미지 최적화
- [ ] CSS/JS 압축 확인

### ⚠️ **주의사항**

1. **환경변수 설정**:
   - 서버에 `.env` 파일 생성 필요
   - 실제 API 키 설정 필요

2. **HTTPS 설정**:
   - SSL 인증서 적용
   - HTTP → HTTPS 리다이렉트

3. **캐시 클리어**:
   - 브라우저 캐시 클리어
   - CDN 캐시 무효화

### 🆘 **문제 해결**

#### **페이지가 로딩되지 않는 경우**:
1. 파일 권한 확인
2. 웹 서버 설정 확인
3. 에러 로그 확인

#### **이미지가 표시되지 않는 경우**:
1. 이미지 파일 경로 확인
2. 파일 권한 확인
3. MIME 타입 설정 확인

### 📞 **지원**

업데이트 과정에서 문제가 발생하면:
- 서버 로그 확인
- 브라우저 개발자 도구 확인
- 네트워크 탭에서 404 에러 확인
