/**
 * 문의/의뢰 이메일 발송 서비스
 * star612.net@gmail.com으로 문의/의뢰 내용을 이메일로 전송
 */
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
const CONTACT_EMAIL = 'star612.net@gmail.com';

export interface ContactFormData {
  title: string;
  type: '문의' | '스토리보드' | 'AI영상' | '강의';
  requester: string;
  email: string;
  phone: string;
  content: string;
  attachment?: File | null;
}

export interface ContactEmailResponse {
  success: boolean;
  message: string;
  error?: string;
}

class ContactEmailService {
  /**
   * 문의/의뢰 내용을 이메일로 전송
   */
  async sendContactEmail(formData: ContactFormData): Promise<ContactEmailResponse> {
    try {
      // FormData 생성 (첨부파일 포함)
      const formDataToSend = new FormData();
      formDataToSend.append('to', CONTACT_EMAIL);
      formDataToSend.append('subject', `[문의/의뢰] ${formData.type} - ${formData.title}`);
      formDataToSend.append('requester', formData.requester);
      formDataToSend.append('requesterEmail', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('type', formData.type);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('title', formData.title);
      
      if (formData.attachment) {
        formDataToSend.append('attachment', formData.attachment);
      }

      // 백엔드 API 호출
      const response = await axios.post(
        `${API_BASE_URL}/contact/send-email`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 5000, // 타임아웃을 5초로 단축하여 빠른 fallback
        }
      );

      return {
        success: true,
        message: '문의/의뢰가 성공적으로 전송되었습니다.',
      };
    } catch (error: any) {
      console.error('이메일 발송 실패:', error);
      
      return {
        success: false,
        message: '이메일 발송 중 오류가 발생했습니다.',
        error: error.response?.data?.message || error.message || '백엔드 서버에 연결할 수 없습니다.',
      };
    }
  }

  /**
   * 이메일 본문 템플릿 생성
   */
  private createEmailTemplate(formData: ContactFormData): string {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
문의/의뢰 접수
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 구분 】
${formData.type}

【 제목 】
${formData.title}

【 의뢰인 】
${formData.requester}

【 이메일 】
${formData.email}

【 연락처 】
${formData.phone}

【 내용 】
${formData.content}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
접수 시간: ${new Date().toLocaleString('ko-KR')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
  }
}

export const contactEmailService = new ContactEmailService();

