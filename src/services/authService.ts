import { User, LoginCredentials, RegisterData } from '../types/auth';
import { CryptoUtils } from '../utils/cryptoUtils';

// 관리자 계정 정보 (환경변수에서 가져옴)
const getAdminUser = async (): Promise<User> => {
  const adminCreds = CryptoUtils.getAdminCredentials();
  const hashedPassword = await CryptoUtils.hashPassword(adminCreds.password);
  
  return {
    id: 'admin-001',
    name: '관리자',
    email: adminCreds.email,
    password: hashedPassword,
    apiKeys: {
      google: process.env.REACT_APP_GEMINI_API_KEY || 'your-google-api-key',
      openai: process.env.REACT_APP_OPENAI_API_KEY || 'your-openai-api-key',
      midjourney: 'your-midjourney-api-key',
      anthropic: process.env.REACT_APP_ANTHROPIC_API_KEY || 'your-anthropic-api-key'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// 로컬 스토리지에서 사용자 데이터 관리
const STORAGE_KEY = 'storyboard_users';
const CURRENT_USER_KEY = 'storyboard_current_user';

export class AuthService {
  // 사용자 데이터 초기화
  static async initializeUsers(): Promise<void> {
    const existingUsers = localStorage.getItem(STORAGE_KEY);
    if (!existingUsers) {
      const adminUser = await getAdminUser();
      localStorage.setItem(STORAGE_KEY, JSON.stringify([adminUser]));
    } else {
      // 기존 사용자가 있으면 관리자 계정 강제 업데이트
      const users = JSON.parse(existingUsers);
      const adminUser = await getAdminUser();
      
      // 기존 관리자 계정 찾기 및 업데이트
      const adminIndex = users.findIndex((u: User) => u.id === 'admin-001');
      if (adminIndex !== -1) {
        users[adminIndex] = adminUser;
      } else {
        users.unshift(adminUser);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
    }
  }

  // 모든 사용자 가져오기
  static async getUsers(): Promise<User[]> {
    const users = localStorage.getItem(STORAGE_KEY);
    if (users) {
      return JSON.parse(users);
    } else {
      // 사용자가 없으면 관리자 계정 생성
      const adminUser = await getAdminUser();
      return [adminUser];
    }
  }

  // 사용자 저장
  static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  // 현재 로그인된 사용자 가져오기
  static getCurrentUser(): User | null {
    const currentUser = localStorage.getItem(CURRENT_USER_KEY);
    return currentUser ? JSON.parse(currentUser) : null;
  }

  // 현재 사용자 저장
  static setCurrentUser(user: User | null): void {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }

  // 로그인
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const users = await this.getUsers();
      console.log('Available users:', users.map(u => ({ email: u.email, id: u.id })));
      
      const user = users.find(u => u.email === credentials.email);
      console.log('Found user:', user ? { email: user.email, id: user.id } : 'Not found');
      
      if (user) {
        // 해시된 비밀번호 검증
        const isValidPassword = await CryptoUtils.verifyPassword(credentials.password, user.password);
        console.log('Password validation result:', isValidPassword);
        
        if (isValidPassword) {
          // 민감한 정보 제거 후 반환
          const sanitizedUser = CryptoUtils.sanitizeUser(user);
          this.setCurrentUser(sanitizedUser);
          return { success: true, user: sanitizedUser };
        }
      }
      
      return { success: false, message: '이메일 또는 비밀번호가 올바르지 않습니다.' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: '로그인 중 오류가 발생했습니다.' };
    }
  }

  // 회원가입
  static async register(data: RegisterData): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const users = await this.getUsers();
      
      // 이메일 중복 확인
      const existingUser = users.find(u => u.email === data.email);
      if (existingUser) {
        return { success: false, message: '이미 사용 중인 이메일입니다.' };
      }

      // 비밀번호 해시화
      const hashedPassword = await CryptoUtils.hashPassword(data.password);

      // 새 사용자 생성
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        password: hashedPassword,
        apiKeys: data.apiKeys || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(newUser);
      this.saveUsers(users);
      
      // 민감한 정보 제거 후 반환
      const sanitizedUser = CryptoUtils.sanitizeUser(newUser);
      this.setCurrentUser(sanitizedUser);

      return { success: true, user: sanitizedUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: '회원가입 중 오류가 발생했습니다.' };
    }
  }

  // 로그아웃
  static logout(): void {
    this.setCurrentUser(null);
  }

  // 사용자 정보 업데이트
  static async updateUser(userId: string, updateData: Partial<RegisterData>): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const users = await this.getUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      
      if (userIndex === -1) {
        return { success: false, message: '사용자를 찾을 수 없습니다.' };
      }

      // 이메일 중복 확인 (자신 제외)
      if (updateData.email && updateData.email !== users[userIndex].email) {
        const existingUser = users.find(u => u.email === updateData.email && u.id !== userId);
        if (existingUser) {
          return { success: false, message: '이미 사용 중인 이메일입니다.' };
        }
      }

      // 비밀번호가 변경되는 경우 해시화
      let hashedPassword = users[userIndex].password;
      if (updateData.password) {
        hashedPassword = await CryptoUtils.hashPassword(updateData.password);
      }

      // 사용자 정보 업데이트
      users[userIndex] = {
        ...users[userIndex],
        ...updateData,
        password: hashedPassword,
        updatedAt: new Date().toISOString()
      };

      this.saveUsers(users);
      
      // 민감한 정보 제거 후 반환
      const sanitizedUser = CryptoUtils.sanitizeUser(users[userIndex]);
      this.setCurrentUser(sanitizedUser);

      return { success: true, user: sanitizedUser };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: '사용자 정보 업데이트 중 오류가 발생했습니다.' };
    }
  }

  // 이메일 유효성 검사
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 비밀번호 유효성 검사
  static validatePassword(password: string): boolean {
    return password.length >= 6;
  }
}
