// 간단한 해시 함수 (실제 프로덕션에서는 더 강력한 해시 알고리즘 사용 권장)
export class CryptoUtils {
  // 간단한 해시 함수 (HTTP 환경 지원)
  static async hashPassword(password: string): Promise<string> {
    // HTTP 환경에서 crypto.subtle이 사용 불가능한 경우 대체 방법
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'storyboard_salt_2025'); // 솔트 추가
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('crypto.subtle not available, using fallback method');
        return this.fallbackHash(password);
      }
    } else {
      return this.fallbackHash(password);
    }
  }

  // 대체 해시 함수 (HTTP 환경용)
  static fallbackHash(password: string): string {
    const str = password + 'storyboard_salt_2025';
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    return Math.abs(hash).toString(16);
  }

  // 비밀번호 검증
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hashedPassword;
  }

  // 환경변수에서 관리자 정보 가져오기
  static getAdminCredentials(): { email: string; password: string } {
    return {
      email: process.env.REACT_APP_ADMIN_EMAIL || 'star612.net@gmail.com',
      password: process.env.REACT_APP_ADMIN_PASSWORD || 'star6120@@'
    };
  }

  // API 키 마스킹 (보안을 위해 일부만 표시)
  static maskApiKey(apiKey: string): string {
    if (!apiKey || apiKey.length < 8) return '****';
    return apiKey.substring(0, 4) + '****' + apiKey.substring(apiKey.length - 4);
  }

  // 민감한 정보 제거
  static sanitizeUser(user: any): any {
    const sanitized = { ...user };
    delete sanitized.password;
    return sanitized;
  }
}
