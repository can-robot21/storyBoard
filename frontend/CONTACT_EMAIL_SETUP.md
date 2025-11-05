# 문의/의뢰 이메일 발송 설정 가이드

## 현재 구현 상태

문의/의뢰 페이지에서 제출된 폼은 `star612.net@gmail.com`으로 이메일을 발송하도록 설정되어 있습니다.

## 구현 방법

### 방법 1: 백엔드 API 엔드포인트 생성 (권장)

백엔드 서버에 이메일 발송 API를 추가해야 합니다.

#### 백엔드 API 엔드포인트 예시

**엔드포인트:** `POST /api/contact/send-email`

**요청 형식:** `multipart/form-data`

**요청 필드:**
- `to`: 수신자 이메일 (star612.net@gmail.com)
- `subject`: 이메일 제목
- `requester`: 의뢰인 이름
- `requesterEmail`: 의뢰인 이메일
- `phone`: 연락처
- `type`: 구분 (문의/스토리보드/AI영상/강의)
- `content`: 문의 내용
- `title`: 제목
- `attachment`: 첨부파일 (선택사항)

**응답 형식:**
```json
{
  "success": true,
  "message": "이메일이 성공적으로 전송되었습니다."
}
```

#### Node.js/Express 예시 코드

```javascript
const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const router = express.Router();

const upload = multer({ dest: 'uploads/' });

// 이메일 전송 설정
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gmail 주소
    pass: process.env.EMAIL_PASSWORD // Gmail 앱 비밀번호
  }
});

router.post('/contact/send-email', upload.single('attachment'), async (req, res) => {
  try {
    const { to, subject, requester, requesterEmail, phone, type, content, title } = req.body;
    const attachment = req.file;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to || 'star612.net@gmail.com',
      subject: subject,
      html: `
        <h2>문의/의뢰 접수</h2>
        <p><strong>구분:</strong> ${type}</p>
        <p><strong>제목:</strong> ${title}</p>
        <p><strong>의뢰인:</strong> ${requester}</p>
        <p><strong>이메일:</strong> ${requesterEmail}</p>
        <p><strong>연락처:</strong> ${phone}</p>
        <p><strong>내용:</strong></p>
        <pre>${content}</pre>
        <p><small>접수 시간: ${new Date().toLocaleString('ko-KR')}</small></p>
      `,
      attachments: attachment ? [{
        filename: attachment.originalname,
        path: attachment.path
      }] : []
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: '이메일이 성공적으로 전송되었습니다.'
    });
  } catch (error) {
    console.error('이메일 발송 실패:', error);
    res.status(500).json({
      success: false,
      message: '이메일 발송 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router;
```

#### 환경 변수 설정 (.env)

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

**Gmail 앱 비밀번호 생성 방법:**
1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. 생성된 비밀번호를 `EMAIL_PASSWORD`에 설정

### 방법 2: 대체 이메일 서비스 사용

백엔드가 없는 경우, 다음 서비스를 사용할 수 있습니다:

#### EmailJS 사용
1. [EmailJS](https://www.emailjs.com/) 계정 생성
2. 이메일 서비스 설정
3. 템플릿 생성
4. 프론트엔드에서 직접 호출

#### FormSubmit 사용
1. 폼의 `action`을 `https://formsubmit.co/star612.net@gmail.com`으로 설정
2. 간단한 설정으로 바로 사용 가능

### 방법 3: 클라이언트 사이드 대체 (현재 구현됨)

백엔드 API가 없는 경우, `mailto:` 링크를 통해 사용자의 기본 이메일 클라이언트를 열어 전송할 수 있습니다.

현재 구현된 `contactEmailService.ts`는 다음과 같이 동작합니다:
1. 먼저 백엔드 API를 호출 시도
2. API가 없는 경우, `mailto:` 링크로 대체

## 추가 조치 사항

### 1. 백엔드 API 엔드포인트 생성
- 위의 예시 코드를 참고하여 백엔드에 이메일 발송 API 추가
- 환경 변수 설정 (Gmail 계정 정보)

### 2. CORS 설정
- 백엔드에서 프론트엔드 도메인에 대한 CORS 허용

### 3. 이메일 템플릿 개선
- HTML 이메일 템플릿 작성
- 브랜딩 적용

### 4. 스팸 방지
- reCAPTCHA 추가 고려
- 요청 제한 (Rate Limiting) 설정

### 5. 로깅 및 모니터링
- 이메일 발송 로그 기록
- 발송 실패 시 알림 설정

## 테스트

1. 문의/의뢰 폼 작성
2. "전송" 버튼 클릭
3. 백엔드 API가 있는 경우: 이메일 발송 확인
4. 백엔드 API가 없는 경우: 이메일 클라이언트가 열리는지 확인

## 현재 설정

- **수신 이메일:** `star612.net@gmail.com`
- **API 엔드포인트:** `POST ${API_BASE_URL}/contact/send-email`
- **대체 방법:** `mailto:` 링크 (백엔드 API가 없는 경우)

