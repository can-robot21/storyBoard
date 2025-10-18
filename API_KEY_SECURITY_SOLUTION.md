# 🔒 API 키 보안 - 근본적 해결 방안

## 🚨 현재 문제점

### React 환경 변수의 한계
```typescript
// ❌ 문제: 빌드된 JavaScript에 하드코딩됨
process.env.REACT_APP_GEMINI_API_KEY
```

**노출 경로**:
1. **빌드된 번들**: `build/static/js/main.*.js`
2. **브라우저 콘솔**: `process.env` 객체
3. **소스맵**: 디버깅 시 확인 가능
4. **네트워크 탭**: API 요청 헤더

## 💡 근본적 해결 방안

### 1. 서버 사이드 프록시 패턴 (권장)

#### 백엔드 API 엔드포인트 생성
```javascript
// backend/routes/api.js
app.post('/api/generate-text', async (req, res) => {
  try {
    const { prompt, model } = req.body;
    
    // 서버에서만 API 키 사용
    const googleAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY // 서버 환경 변수
    });
    
    const result = await googleAI.generateText(prompt, model);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### 프론트엔드에서 프록시 호출
```typescript
// frontend/src/services/googleAIService.ts
export class GoogleAIService {
  async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    try {
      // 클라이언트에서는 API 키 없이 프록시 호출
      const response = await fetch('/api/generate-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getUserToken()}` // 사용자 인증 토큰
        },
        body: JSON.stringify({ prompt, model })
      });
      
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      
      return result.data;
    } catch (error) {
      console.error('텍스트 생성 실패:', error);
      throw error;
    }
  }
  
  private getUserToken(): string {
    // 사용자 세션 토큰 반환
    return localStorage.getItem('user_token') || '';
  }
}
```

### 2. 동적 API 키 로딩 패턴

#### 서버에서 키 발급
```javascript
// backend/routes/auth.js
app.post('/api/get-api-key', authenticateUser, async (req, res) => {
  try {
    const { provider } = req.body;
    const userId = req.user.id;
    
    // 사용자별 암호화된 API 키 반환
    const encryptedKey = await getUserApiKey(userId, provider);
    const temporaryKey = generateTemporaryKey(encryptedKey, '1hour');
    
    res.json({ 
      success: true, 
      temporaryKey,
      expiresAt: Date.now() + 3600000 // 1시간 후 만료
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### 클라이언트에서 임시 키 사용
```typescript
// frontend/src/services/googleAIService.ts
export class GoogleAIService {
  private temporaryKey: string | null = null;
  private keyExpiresAt: number = 0;
  
  private async getTemporaryApiKey(): Promise<string> {
    // 키가 유효한지 확인
    if (this.temporaryKey && Date.now() < this.keyExpiresAt) {
      return this.temporaryKey;
    }
    
    // 새 임시 키 요청
    const response = await fetch('/api/get-api-key', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getUserToken()}`
      },
      body: JSON.stringify({ provider: 'google' })
    });
    
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    
    this.temporaryKey = result.temporaryKey;
    this.keyExpiresAt = result.expiresAt;
    
    return this.temporaryKey;
  }
  
  async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
    const apiKey = await this.getTemporaryApiKey();
    
    const googleAI = new GoogleGenAI({ apiKey });
    return await googleAI.generateText(prompt, model);
  }
}
```

### 3. 환경별 분리 패턴

#### 개발 환경
```typescript
// 개발 시에만 환경 변수 사용 (로컬 개발용)
const isDevelopment = process.env.NODE_ENV === 'development';
const isLocalhost = window.location.hostname === 'localhost';

if (isDevelopment && isLocalhost) {
  // 로컬 개발 시에만 환경 변수 사용
  this.apiKey = process.env.REACT_APP_GEMINI_API_KEY;
} else {
  // 프로덕션에서는 서버 프록시 사용
  this.apiKey = await this.getTemporaryApiKey();
}
```

#### 프로덕션 환경
```typescript
// 프로덕션에서는 절대 환경 변수 사용 금지
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // 서버 프록시만 사용
  return await this.callServerProxy(endpoint, data);
} else {
  // 개발 환경에서만 직접 호출
  return await this.callDirectAPI(data);
}
```

## 🛡️ 보안 강화 방안

### 1. API 키 제한사항 설정
```javascript
// Google Cloud Console에서 설정
{
  "application_restrictions": {
    "android_apps": [],
    "ios_apps": [],
    "web_sites": [
      {
        "site": "https://yourdomain.com"
      }
    ]
  },
  "api_targets": [
    {
      "service": "generativelanguage.googleapis.com"
    }
  ]
}
```

### 2. 사용량 모니터링
```javascript
// 서버에서 사용량 추적
app.use('/api/*', (req, res, next) => {
  const userId = req.user?.id;
  const endpoint = req.path;
  
  // 사용량 기록
  recordApiUsage(userId, endpoint, Date.now());
  
  // 제한 확인
  if (isUsageExceeded(userId)) {
    return res.status(429).json({ error: 'API 사용량 초과' });
  }
  
  next();
});
```

### 3. 키 로테이션
```javascript
// 정기적인 API 키 교체
const rotateApiKeys = async () => {
  const users = await getAllUsers();
  
  for (const user of users) {
    const newKey = await generateNewApiKey();
    await updateUserApiKey(user.id, newKey);
    
    // 기존 키 무효화
    await invalidateOldKey(user.id);
  }
};

// 매일 자정에 실행
cron.schedule('0 0 * * *', rotateApiKeys);
```

## 📋 구현 우선순위

### Phase 1: 즉시 적용 (1주일)
1. ✅ 소스 코드에서 환경 변수 제거
2. ✅ 서버 프록시 엔드포인트 생성
3. ✅ 클라이언트에서 프록시 호출로 변경

### Phase 2: 보안 강화 (2주일)
1. 🔄 API 키 제한사항 설정
2. 🔄 사용량 모니터링 구현
3. 🔄 사용자 인증 강화

### Phase 3: 고도화 (1개월)
1. 🔄 키 로테이션 시스템
2. 🔄 실시간 보안 모니터링
3. 🔄 자동화된 보안 감사

## ⚠️ 주의사항

### 절대 하지 말아야 할 것
- 클라이언트 사이드에 API 키 포함
- 환경 변수를 프로덕션에서 사용
- API 키를 로그에 기록
- 소스 코드에 하드코딩

### 반드시 해야 할 것
- 서버 사이드에서만 API 키 사용
- 사용자 인증 및 권한 확인
- API 사용량 모니터링
- 정기적인 보안 감사

---

**최종 업데이트**: 2025년 1월 27일  
**문서 버전**: 2.0  
**작성자**: AI Assistant (Claude)
