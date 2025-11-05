import React, { useState } from 'react';
import { Send, FileText, Mail, Phone, User, MessageSquare, Upload, ChevronDown, ChevronUp, Film, Video, Music, Tag } from 'lucide-react';
import { contactEmailService, ContactFormData } from '../../services/contactEmailService';
import { useUIStore } from '../../stores/uiStore';
import SEO from './SEO';

interface ContactPageProps {
  onBack?: () => void;
}

type InquiryType = '문의' | '스토리보드' | 'AI영상' | '강의';

const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const { addNotification } = useUIStore();
  const [formData, setFormData] = useState({
    title: '',
    type: '문의' as InquiryType,
    requester: '',
    email: '',
    phone: '',
    content: '',
    attachment: null as File | null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      attachment: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const contactData: ContactFormData = {
        title: formData.title,
        type: formData.type,
        requester: formData.requester,
        email: formData.email,
        phone: formData.phone,
        content: formData.content,
        attachment: formData.attachment
      };

      const result = await contactEmailService.sendContactEmail(contactData);
      
      if (result.success) {
        setSubmitSuccess(true);
        addNotification({
          type: 'success',
          title: '문의/의뢰 전송 완료',
          message: result.message
        });
        
        // 폼 초기화
        setFormData({
          title: '',
          type: '문의',
          requester: '',
          email: '',
          phone: '',
          content: '',
          attachment: null
        });

        // 5초 후 성공 메시지 숨기기
        setTimeout(() => {
          setSubmitSuccess(false);
        }, 5000);
      } else {
        // 실패한 경우에만 에러 처리
        addNotification({
          type: 'error',
          title: '전송 실패',
          message: result.error || result.message || '문의/의뢰 제출 중 오류가 발생했습니다. 다시 시도해주세요.'
        });
      }
    } catch (error: any) {
      // 예상치 못한 에러만 콘솔에 출력
      console.error('문의/의뢰 제출 중 예상치 못한 에러:', error);
      addNotification({
        type: 'error',
        title: '전송 실패',
        message: error.message || '문의/의뢰 제출 중 오류가 발생했습니다. 다시 시도해주세요.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <SEO 
        title="문의/의뢰 - StoryBoard AI - 스토리보드/영상 AI"
        description="StoryBoard AI 서비스에 대한 문의 및 의뢰를 받고 있습니다. 스토리보드 제작, AI 영상 제작, 강의 등 다양한 서비스를 제공합니다. Contact us for StoryBoard AI services: storyboard creation, AI video production, and educational services."
        keywords="StoryBoard AI 문의, 스토리보드 의뢰, 영상 제작 문의, AI 영상 의뢰, 스토리보드 제작 의뢰, 영상 제작 서비스, ChatGPT, 챗GPT, 구글 AI, Google AI, 제미니, Gemini, 나노 바나나, Nano Banana, kling, Kling, 콘티, conti, 콘티 제작, StoryBoard AI contact, storyboard inquiry, video production request, AI video service, storyboard creation service, 문의하기, 의뢰하기, 스토리보드 제작 서비스, 영상 제작 서비스"
      />
      {/* 상단 설명 영역 */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              스토리보드/AI 영상 제작 서비스
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              AI 기반 스토리보드와 영상 제작 서비스를 통해 창의적인 콘텐츠를 제작하세요.
              전문가와의 협의를 통해 최고 품질의 결과물을 제공합니다.
            </p>
          </div>

          {/* 제작 과정 설명 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
              제작 과정
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* 협의 단계 */}
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">협의</h3>
                <p className="text-gray-600">
                  프로젝트 요구사항과 목표를 상세히 논의하고<br />
                  최적의 제작 방향을 결정합니다.
                </p>
              </div>

              {/* 스케치 단계 */}
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">스케치</h3>
                <p className="text-gray-600">
                  AI를 활용한 초안 스토리보드와<br />
                  콘셉트 이미지를 제작합니다.
                </p>
              </div>

              {/* 제작 단계 */}
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">제작</h3>
                <p className="text-gray-600">
                  최종 승인 후 전문가가 직접<br />
                  고품질 영상과 스토리보드를 완성합니다.
                </p>
              </div>
            </div>

            {/* 기본 제작 일정 */}
            <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                기본 제작 일정
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-300">
                      <th className="px-4 py-3 text-left font-semibold text-gray-800 bg-gray-50">단계</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-800 bg-gray-50 border-l border-gray-300">스토리보드</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-800 bg-gray-50 border-l border-gray-300">AI 영상</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-800 bg-gray-50 border-l border-gray-300">전체 프로젝트</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="px-4 py-3 text-gray-700 font-medium">제작 내용 반영해 협의</td>
                      <td className="px-4 py-3 text-center text-blue-600 font-semibold border-l border-gray-200">협의</td>
                      <td className="px-4 py-3 text-center text-purple-600 font-semibold border-l border-gray-200">협의</td>
                      <td className="px-4 py-3 text-center text-green-600 font-semibold border-l border-gray-200">협의</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 제작 방법 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
              제작 방법
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* 콘티/스토리보드 */}
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">콘티/스토리보드</h3>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Film className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-2 text-gray-600 text-sm">
                  <div>회의에서 요구사항을 파악하고</div>
                  <div>스케치를 통해 작가와 AI가 협업하여 제작합니다</div>
                </div>
              </div>

              {/* AI 영상 */}
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">AI 영상</h3>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Video className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-2 text-gray-600 text-sm">
                  <div>숏폼(SNS/Youtube), 기업용 영상,</div>
                  <div>채널관리 등 다양한 영상 콘텐츠를 제작합니다</div>
                </div>
              </div>

              {/* 뮤비/단편/숏폼드라마 */}
              <div className="bg-white rounded-lg p-6 shadow-md text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">뮤비/단편/숏폼드라마</h3>
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Music className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="space-y-2 text-gray-600 text-sm">
                  <div>기획부터 협의, 콘티, AI영상까지</div>
                  <div>전체 프로세스를 체계적으로 관리하여 완성도 높은 작품을 제작합니다</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 폼메일 영역 */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* 문의/의뢰하기 버튼 */}
        <div className="text-center mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg shadow-lg"
          >
            <MessageSquare className="w-5 h-5" />
            문의/의뢰하기
            {showForm ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* 폼 영역 (기본적으로 숨김) */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex gap-6 items-start">
              {/* 왼쪽 타이틀 박스 (1/4) */}
              <div className="w-1/4 flex-shrink-0">
                <div className="bg-transparent border-2 border-gray-300 rounded-lg p-6 aspect-square flex items-center justify-center">
                  <h2 className="text-xl font-bold text-gray-800 text-center">
                    문의/의뢰하기
                  </h2>
                </div>
              </div>

              {/* 오른쪽 폼메일 (3/4) */}
              <div className="flex-1">
                {submitSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    문의/의뢰가 성공적으로 전송되었습니다. 빠른 시일 내에 답변드리겠습니다.
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
            {/* 제목 */}
            <div className="flex items-center gap-4">
              <label htmlFor="title" className="w-1/3 text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>제목 *</span>
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="문의 제목을 입력해주세요"
                />
              </div>
            </div>

            {/* 구분 */}
            <div className="flex items-center gap-4">
              <label htmlFor="type" className="w-1/3 text-sm font-medium text-gray-700 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>구분 *</span>
              </label>
              <div className="flex-1">
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="문의">문의</option>
                  <option value="스토리보드">스토리보드</option>
                  <option value="AI영상">AI영상</option>
                  <option value="강의">강의</option>
                </select>
              </div>
            </div>

            {/* 의뢰인 */}
            <div className="flex items-center gap-4">
              <label htmlFor="requester" className="w-1/3 text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>의뢰인 *</span>
              </label>
              <div className="flex-1">
                <input
                  type="text"
                  id="requester"
                  name="requester"
                  required
                  value={formData.requester}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이름 또는 회사명을 입력해주세요"
                />
              </div>
            </div>

            {/* 이메일 */}
            <div className="flex items-center gap-4">
              <label htmlFor="email" className="w-1/3 text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>이메일 *</span>
              </label>
              <div className="flex-1">
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            {/* 연락처 */}
            <div className="flex items-center gap-4">
              <label htmlFor="phone" className="w-1/3 text-sm font-medium text-gray-700 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>연락처 *</span>
              </label>
              <div className="flex-1">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                />
              </div>
            </div>

            {/* 내용 */}
            <div className="flex items-start gap-4">
              <label htmlFor="content" className="w-1/3 text-sm font-medium text-gray-700 flex items-center gap-2 pt-2">
                <MessageSquare className="w-4 h-4" />
                <span>내용 *</span>
              </label>
              <div className="flex-1">
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={6}
                  value={formData.content}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="문의하실 내용을 상세히 입력해주세요"
                />
              </div>
            </div>

            {/* 첨부파일 */}
            <div className="flex items-center gap-4">
              <label htmlFor="attachment" className="w-1/3 text-sm font-medium text-gray-700 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>첨부파일</span>
              </label>
              <div className="flex-1">
                <input
                  type="file"
                  id="attachment"
                  name="attachment"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
                />
                {formData.attachment && (
                  <p className="mt-2 text-sm text-gray-600">
                    선택된 파일: {formData.attachment.name}
                  </p>
                )}
              </div>
            </div>

                  {/* 전송 버튼 */}
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          전송 중...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          전송
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactPage;

