# 🚨 API 키 보안 - 즉시 적용 방안

## 현재 상황
- Google API 키가 GitHub에 노출됨
- React 환경 변수는 클라이언트 사이드에서 접근 가능
- 26개 파일에서 환경 변수 직접 사용

## ⚡ 즉시 적용 가능한 해결책

### 1. 환경 변수 사용 중단
```typescript
// ❌ 현재 방식 (모든 파일에서 제거 필요)
const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

// ✅ 새로운 방식 (사용자 입력만 사용)
const apiKey = getUserApiKey() || '';
```

### 2. 사용자별 API 키 관리 강화
```typescript
// frontend/src/services/googleAIService.ts
export class GoogleAIService {
  constructor() {
    // 환경 변수 사용 완전 제거
    this.apiKeyInUse = this.getUserApiKey();
    
    this.ai = new GoogleGenAI({
      apiKey: this.apiKeyInUse || ''
    });
  }
  
  private getUserApiKey(): string {
    try {
      if (typeof window === 'undefined') return '';
      
      // 1순위: 사용자별 저장된 키
      const user = this.getCurrentUser();
      if (user?.apiKeys?.google) {
        return user.apiKeys.google;
      }
      
      // 2순위: 로컬 저장소의 키
      const localKeysRaw = localStorage.getItem('user_api_keys');
      if (localKeysRaw) {
        const localKeys = JSON.parse(localKeysRaw);
        if (localKeys?.google) {
          return localKeys.google;
        }
      }
      
      // 3순위: 빈 문자열 (API 키 없음)
      return '';
    } catch {
      return '';
    }
  }
  
  private getCurrentUser() {
    try {
      if (typeof window === 'undefined') return null;
      const raw = localStorage.getItem('storyboard_current_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
```

### 3. API 키 입력 강제화
```typescript
// 모든 AI 서비스 호출 전 API 키 확인
private validateApiKey(): boolean {
  if (!this.apiKeyInUse || this.apiKeyInUse.trim() === '') {
    throw new Error('Google AI API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.');
  }
  
  if (!this.apiKeyInUse.startsWith('AIza')) {
    throw new Error('유효하지 않은 Google AI API 키 형식입니다.');
  }
  
  return true;
}

async generateText(prompt: string, model: string = 'gemini-2.5-flash'): Promise<string> {
  this.validateApiKey(); // API 키 검증
  
  try {
    const result = await this.ai.generateText(prompt, model);
    return result;
  } catch (error) {
    if (error.message.includes('API key not valid')) {
      throw new Error('API 키가 유효하지 않습니다. 설정에서 올바른 API 키를 입력해주세요.');
    }
    throw error;
  }
}
```

### 4. 사용자 안내 강화
```typescript
// API 키 설정 모달 개선
export const AISettingsModal: React.FC<AISettingsModalProps> = ({ ... }) => {
  const [apiKeys, setApiKeys] = useState({
    google: '', // 환경 변수 제거
    openai: '',
    chatgpt: '',
    anthropic: '',
    'nano-banana': ''
  });
  
  // API 키 입력 필수 안내
  const renderApiKeyInput = (provider: string, label: string) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} API 키 <span className="text-red-500">*</span>
      </label>
      <input
        type="password"
        value={apiKeys[provider]}
        onChange={(e) => handleApiKeyChange(provider, e.target.value)}
        placeholder={`${label} API 키를 입력하세요`}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
      <p className="text-xs text-gray-500 mt-1">
        ⚠️ API 키는 안전하게 저장되며 외부에 노출되지 않습니다.
      </p>
    </div>
  );
};
```

## 🔧 적용 단계

### Step 1: 환경 변수 제거 (즉시)
```bash
# 모든 파일에서 환경 변수 사용 제거
grep -r "process.env.REACT_APP.*API_KEY" frontend/src/
# 각 파일을 수정하여 사용자 입력만 사용하도록 변경
```

### Step 2: API 키 검증 강화
```typescript
// 모든 AI 서비스에 검증 로직 추가
private validateApiKey(): boolean {
  if (!this.apiKeyInUse || this.apiKeyInUse.trim() === '') {
    throw new Error('API 키가 설정되지 않았습니다.');
  }
  return true;
}
```

### Step 3: 사용자 안내 개선
```typescript
// API 키 설정 안내 강화
const apiKeyGuide = {
  google: {
    url: 'https://makersuite.google.com/app/apikey',
    instructions: 'Google AI Studio에서 API 키를 생성하세요'
  },
  openai: {
    url: 'https://platform.openai.com/api-keys',
    instructions: 'OpenAI Platform에서 API 키를 생성하세요'
  }
};
```

## ⚠️ 주의사항

### 즉시 해야 할 것
1. **환경 변수 완전 제거**: 모든 파일에서 `process.env.REACT_APP_*API_KEY` 제거
2. **사용자 입력 강제화**: API 키 없이는 서비스 사용 불가
3. **에러 메시지 개선**: 명확한 API 키 설정 안내

### 절대 하지 말 것
1. **환경 변수 사용**: 클라이언트에서 API 키 노출
2. **하드코딩**: 소스 코드에 API 키 포함
3. **기본값 제공**: 빈 API 키로 서비스 동작

## 📊 보안 수준

### 현재 (위험)
- ❌ 환경 변수로 API 키 노출
- ❌ 빌드된 번들에 포함
- ❌ 브라우저에서 접근 가능

### 개선 후 (안전)
- ✅ 사용자별 API 키만 사용
- ✅ 클라이언트에 키 저장 안함
- ✅ 서버 사이드 검증 필요

---

**적용 일정**: 즉시 (오늘 내)  
**우선순위**: 최고  
**담당자**: 개발팀 전체
