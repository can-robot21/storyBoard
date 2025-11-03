import { User, LoginCredentials, RegisterData } from '../types/auth';
import { CryptoUtils } from '../utils/cryptoUtils';
import { databaseService } from './database/DatabaseService';
import { User as DBUser } from '../types/project';
import { userMigrationService, MigrationResult } from './userMigrationService';
import { GoogleAIService } from './googleAIService';
import { AIServiceFactoryImpl } from './ai/AIServiceFactory';

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
        google: '',  // 관리자도 개인 API 키 입력 필요
        openai: '',   // 관리자도 개인 API 키 입력 필요
        midjourney: '',
        anthropic: ''  // 관리자도 개인 API 키 입력 필요
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  };

// 로컬 스토리지에서 사용자 데이터 관리
const STORAGE_KEY = 'storyboard_users';
const CURRENT_USER_KEY = 'storyboard_current_user';

export class AuthService {
  // 관리자 계정 확인
  static isAdminUser(email: string): boolean {
    const adminCreds = CryptoUtils.getAdminCredentials();
    return email === adminCreds.email;
  }

  // 사용자 데이터 초기화
  static async initializeUsers(): Promise<void> {
    try {
      // 데이터베이스 관리자 계정 확인
      const adminCreds = CryptoUtils.getAdminCredentials();
      let adminUser: DBUser | null = null;

      try {
        const adminUserId = await databaseService.authenticateUser(adminCreds.email, adminCreds.password);
        if (adminUserId) {
          adminUser = await databaseService.getUserById(adminUserId);
        }
      } catch (error) {
        // 관리자 계정이 없으면 생성
        console.log('관리자 계정이 없어서 새로 생성합니다.');
      }

      if (!adminUser) {
        try {
          // 관리자 계정 생성
          const adminUserId = await databaseService.createUser(
            adminCreds.email,
            '관리자',
            adminCreds.password
          );

          // 관리자도 개인 API 키를 입력해야 함 (환경변수 API 키 저장 안함)

          console.log('관리자 계정이 생성되었습니다.');
        } catch (error) {
          if (error instanceof Error && error.message.includes('이미 존재하는 이메일')) {
            console.log('관리자 계정이 이미 존재합니다.');
            // 기존 관리자 계정으로 인증 시도
            const adminUserId = await databaseService.authenticateUser(adminCreds.email, adminCreds.password);
            if (adminUserId) {
              adminUser = await databaseService.getUserById(adminUserId);
            }
          } else {
            throw error;
          }
        }
      }

      // 기존 localStorage 사용자도 DB로 마이그레이션
      await this.migrateLocalStorageUsers();

    } catch (error) {
      console.error('사용자 초기화 실패, localStorage 사용:', error);
      // DB 초기화 실패시 기존 로직 사용
      await this.initializeUsersLegacy();
    }
  }

  // 기존 localStorage 사용자를 DB로 마이그레이션
  static async migrateLocalStorageUsers(): Promise<void> {
    try {
      const existingUsers = localStorage.getItem(STORAGE_KEY);
      if (!existingUsers) return;

      const users: User[] = JSON.parse(existingUsers);
      for (const user of users) {
        if (user.id === 'admin-001') continue; // 관리자는 이미 처리됨

        try {
          // 이미 DB에 있는지 확인
          const existingUserId = await databaseService.authenticateUser(user.email, user.password);
          if (!existingUserId) {
            // DB에 사용자 생성 (비밀번호는 이미 해시됨)
            const newUserId = await databaseService.createUser(user.email, user.name, user.password);

            // API 키 저장
            if (user.apiKeys) {
              for (const [provider, apiKey] of Object.entries(user.apiKeys)) {
                if (apiKey) {
                  await databaseService.saveUserApiKey(newUserId, provider, apiKey);
                }
              }
            }
          }
        } catch (error) {
          console.error('사용자 마이그레이션 실패:', user.email, error);
        }
      }

      console.log('사용자 마이그레이션 완료');
    } catch (error) {
      console.error('마이그레이션 프로세스 실패:', error);
    }
  }

  // 사용자 데이터 마이그레이션 실행
  static async executeUserMigration(
    fromUserId: string,
    toUserId: string,
    options?: any
  ): Promise<MigrationResult> {
    try {
      console.log('🔄 사용자 데이터 마이그레이션 시작');
      const result = await userMigrationService.migrateUserData(fromUserId, toUserId, options);
      
      if (result.success) {
        console.log('✅ 사용자 데이터 마이그레이션 완료');
      } else {
        console.warn('⚠️ 사용자 데이터 마이그레이션 부분 완료:', result.errors);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 사용자 데이터 마이그레이션 실패:', error);
      throw error;
    }
  }

  // 사용자 변경시 데이터 정리
  static async cleanupUserData(userId: string, preserveData: boolean = false): Promise<void> {
    try {
      console.log('🧹 사용자 데이터 정리 시작:', userId);
      
      if (!preserveData) {
        // 프로젝트 데이터 삭제
        const projects = await databaseService.listProjects(userId);
        for (const project of projects) {
          await databaseService.deleteProject(project.projectId);
        }
        
        // 템플릿 데이터 삭제
        const templates = await databaseService.listPromptTemplates(userId);
        for (const template of templates) {
          await databaseService.deletePromptTemplate(template.id);
        }
        
        // API 키 삭제
        const apiKeys = await databaseService.getUserApiKeys(userId);
        for (const provider of Object.keys(apiKeys)) {
          await databaseService.deleteUserApiKey(userId, provider);
        }
        
        console.log('🗑️ 사용자 데이터 완전 삭제 완료');
      } else {
        console.log('💾 사용자 데이터 보존 모드');
      }
    } catch (error) {
      console.error('❌ 사용자 데이터 정리 실패:', error);
      throw error;
    }
  }

  // 기존 방식으로 초기화 (폴백)
  static async initializeUsersLegacy(): Promise<void> {
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
  static async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; message?: string; needsMigration?: boolean }> {
    try {
      const currentUser = this.getCurrentUser();
      
      // DB에서 사용자 인증 시도
      try {
        const userId = await databaseService.authenticateUser(credentials.email, credentials.password);
        if (userId) {
          const dbUser = await databaseService.getUserById(userId);
          if (dbUser) {
            // API 키도 함께 로드
            const apiKeys = await databaseService.getUserApiKeys(userId);

            const user: User = {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              password: '', // 보안을 위해 비워둠
              apiKeys,
              createdAt: new Date(dbUser.created_at).toISOString(),
              updatedAt: new Date(dbUser.updated_at).toISOString()
            };

            const sanitizedUser = CryptoUtils.sanitizeUser(user);
            
            // 사용자 변경 감지
            if (currentUser && currentUser.id !== sanitizedUser.id) {
              console.log('🔄 사용자 변경 감지:', currentUser.id, '→', sanitizedUser.id);
              return { 
                success: true, 
                user: sanitizedUser, 
                needsMigration: true 
              };
            }
            
            this.setCurrentUser(sanitizedUser);
            return { success: true, user: sanitizedUser };
          }
        }
      } catch (error) {
        console.log('DB 로그인 실패, localStorage 시도:', error);
      }

      // DB 실패시 localStorage 폴백
      const users = await this.getUsers();
      const user = users.find(u => u.email === credentials.email);

      if (user) {
        const isValidPassword = await CryptoUtils.verifyPassword(credentials.password, user.password);
        if (isValidPassword) {
          const sanitizedUser = CryptoUtils.sanitizeUser(user);
          
          // 사용자 변경 감지
          if (currentUser && currentUser.id !== sanitizedUser.id) {
            console.log('🔄 사용자 변경 감지 (localStorage):', currentUser.id, '→', sanitizedUser.id);
            return { 
              success: true, 
              user: sanitizedUser, 
              needsMigration: true 
            };
          }
          
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
      // DB에 사용자 생성 시도
      try {
        const userId = await databaseService.createUser(data.email, data.name, data.password);

        // API 키 저장
        if (data.apiKeys) {
          for (const [provider, apiKey] of Object.entries(data.apiKeys)) {
            if (apiKey) {
              await databaseService.saveUserApiKey(userId, provider, apiKey);
            }
          }
        }

        const dbUser = await databaseService.getUserById(userId);
        if (dbUser) {
          const apiKeys = await databaseService.getUserApiKeys(userId);

          const user: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            password: '', // 보안을 위해 비워둠
            apiKeys,
            createdAt: new Date(dbUser.created_at).toISOString(),
            updatedAt: new Date(dbUser.updated_at).toISOString()
          };

          const sanitizedUser = CryptoUtils.sanitizeUser(user);
          this.setCurrentUser(sanitizedUser);
          return { success: true, user: sanitizedUser };
        }
      } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
          return { success: false, message: '이미 사용 중인 이메일입니다.' };
        }
        console.log('DB 회원가입 실패, localStorage 사용:', error);
      }

      // DB 실패시 localStorage 폴백
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
    // GoogleAIService 인스턴스 무효화
    GoogleAIService.invalidateInstance();
    
    // AIServiceFactory의 모든 서비스 무효화
    AIServiceFactoryImpl.getInstance().invalidateAllServices();
    
    this.setCurrentUser(null);
  }

  // 사용자 정보 업데이트
  static async updateUser(userId: string, updateData: Partial<RegisterData>): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      // DB 업데이트 시도
      try {
        const dbUpdateData: any = {};
        if (updateData.name) dbUpdateData.name = updateData.name;
        if (updateData.email) dbUpdateData.email = updateData.email;
        if (updateData.password) dbUpdateData.password = updateData.password;

        const success = await databaseService.updateUser(userId, dbUpdateData);
        if (success) {
          // API 키 업데이트
          if (updateData.apiKeys) {
            for (const [provider, apiKey] of Object.entries(updateData.apiKeys)) {
              if (apiKey) {
                await databaseService.saveUserApiKey(userId, provider, apiKey);
              } else {
                await databaseService.deleteUserApiKey(userId, provider);
              }
            }
          }

          const dbUser = await databaseService.getUserById(userId);
          if (dbUser) {
            const apiKeys = await databaseService.getUserApiKeys(userId);

            const user: User = {
              id: dbUser.id,
              name: dbUser.name,
              email: dbUser.email,
              password: '', // 보안을 위해 비워둠
              apiKeys,
              createdAt: new Date(dbUser.created_at).toISOString(),
              updatedAt: new Date(dbUser.updated_at).toISOString()
            };

            const sanitizedUser = CryptoUtils.sanitizeUser(user);
            this.setCurrentUser(sanitizedUser);
            return { success: true, user: sanitizedUser };
          }
        }
      } catch (error: any) {
        if (error.message.includes('UNIQUE constraint failed')) {
          return { success: false, message: '이미 사용 중인 이메일입니다.' };
        }
        console.log('DB 업데이트 실패, localStorage 사용:', error);
      }

      // DB 실패시 localStorage 폴백
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
