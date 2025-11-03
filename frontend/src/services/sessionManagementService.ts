import { AuthService } from './authService';
import { User } from '../types/auth';

export interface SessionInfo {
  userId: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
  expiresAt: number;
  isActive: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  maxSessions: number;
  autoLogout: boolean;
  rememberMe: boolean;
}

export interface SessionEvent {
  type: 'login' | 'logout' | 'activity' | 'warning' | 'expired' | 'extended';
  timestamp: number;
  sessionId: string;
  userId: string;
  details?: any;
}

export class SessionManagementService {
  private static instance: SessionManagementService;
  private currentSession: SessionInfo | null = null;
  private sessionConfig: SessionConfig = {
    timeoutMinutes: 30,
    warningMinutes: 5,
    maxSessions: 3,
    autoLogout: true,
    rememberMe: false
  };
  private sessionEvents: SessionEvent[] = [];
  private warningTimer: NodeJS.Timeout | null = null;
  private logoutTimer: NodeJS.Timeout | null = null;
  private activityListeners: Array<() => void> = [];

  static getInstance(): SessionManagementService {
    if (!SessionManagementService.instance) {
      SessionManagementService.instance = new SessionManagementService();
    }
    return SessionManagementService.instance;
  }

  constructor() {
    this.initializeActivityListeners();
    this.loadSessionConfig();
  }

  /**
   * 세션 시작
   */
  startSession(user: User, options?: {
    rememberMe?: boolean;
    ipAddress?: string;
    userAgent?: string;
  }): SessionInfo {
    try {
      // 기존 세션 정리
      this.endSession();

      // 새 세션 생성
      const sessionId = this.generateSessionId();
      const now = Date.now();
      const timeoutMs = (options?.rememberMe ? 7 * 24 * 60 : this.sessionConfig.timeoutMinutes) * 60 * 1000;

      this.currentSession = {
        userId: user.id,
        sessionId,
        startTime: now,
        lastActivity: now,
        expiresAt: now + timeoutMs,
        isActive: true,
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent
      };

      // 세션 저장
      this.saveSession();

      // 타이머 설정
      this.setupSessionTimers();

      // 이벤트 기록
      this.recordSessionEvent('login', {
        user: { id: user.id, email: user.email },
        rememberMe: options?.rememberMe || false
      });

      console.log(`🔐 세션 시작: ${sessionId} (${user.email})`);
      return this.currentSession;
    } catch (error) {
      console.error('세션 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 세션 종료
   */
  endSession(): void {
    try {
      if (this.currentSession) {
        // 이벤트 기록
        this.recordSessionEvent('logout', {
          sessionDuration: Date.now() - this.currentSession.startTime
        });

        console.log(`🔓 세션 종료: ${this.currentSession.sessionId}`);
      }

      // 타이머 정리
      this.clearSessionTimers();

      // 세션 데이터 정리
      this.currentSession = null;
      localStorage.removeItem('current_session');
    } catch (error) {
      console.error('세션 종료 실패:', error);
    }
  }

  /**
   * 세션 연장
   */
  extendSession(): boolean {
    try {
      if (!this.currentSession || !this.currentSession.isActive) {
        return false;
      }

      const now = Date.now();
      const timeoutMs = this.sessionConfig.timeoutMinutes * 60 * 1000;

      this.currentSession.lastActivity = now;
      this.currentSession.expiresAt = now + timeoutMs;

      // 세션 저장
      this.saveSession();

      // 타이머 재설정
      this.setupSessionTimers();

      // 이벤트 기록
      this.recordSessionEvent('extended');

      console.log(`⏰ 세션 연장: ${this.currentSession.sessionId}`);
      return true;
    } catch (error) {
      console.error('세션 연장 실패:', error);
      return false;
    }
  }

  /**
   * 세션 상태 확인
   */
  checkSessionStatus(): {
    isValid: boolean;
    isExpired: boolean;
    isWarning: boolean;
    timeRemaining: number;
    session: SessionInfo | null;
  } {
    const now = Date.now();
    
    if (!this.currentSession || !this.currentSession.isActive) {
      return {
        isValid: false,
        isExpired: true,
        isWarning: false,
        timeRemaining: 0,
        session: null
      };
    }

    const timeRemaining = this.currentSession.expiresAt - now;
    const isExpired = timeRemaining <= 0;
    const isWarning = timeRemaining <= (this.sessionConfig.warningMinutes * 60 * 1000);
    const isValid = !isExpired;

    return {
      isValid,
      isExpired,
      isWarning,
      timeRemaining: Math.max(0, timeRemaining),
      session: this.currentSession
    };
  }

  /**
   * 세션 설정 업데이트
   */
  updateSessionConfig(config: Partial<SessionConfig>): void {
    this.sessionConfig = { ...this.sessionConfig, ...config };
    this.saveSessionConfig();

    // 현재 세션이 있으면 타이머 재설정
    if (this.currentSession) {
      this.setupSessionTimers();
    }

    console.log('⚙️ 세션 설정 업데이트:', this.sessionConfig);
  }

  /**
   * 세션 설정 조회
   */
  getSessionConfig(): SessionConfig {
    return { ...this.sessionConfig };
  }

  /**
   * 세션 이벤트 기록
   */
  private recordSessionEvent(
    type: SessionEvent['type'],
    details?: any
  ): void {
    if (!this.currentSession) return;

    const event: SessionEvent = {
      type,
      timestamp: Date.now(),
      sessionId: this.currentSession.sessionId,
      userId: this.currentSession.userId,
      details
    };

    this.sessionEvents.push(event);

    // 이벤트 저장 (최근 100개만)
    if (this.sessionEvents.length > 100) {
      this.sessionEvents = this.sessionEvents.slice(-100);
    }

    this.saveSessionEvents();
  }

  /**
   * 세션 이벤트 조회
   */
  getSessionEvents(): SessionEvent[] {
    return [...this.sessionEvents];
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 세션 타이머 설정
   */
  private setupSessionTimers(): void {
    this.clearSessionTimers();

    if (!this.currentSession) return;

    const now = Date.now();
    const timeRemaining = this.currentSession.expiresAt - now;
    const warningTime = timeRemaining - (this.sessionConfig.warningMinutes * 60 * 1000);

    // 경고 타이머
    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        this.handleSessionWarning();
      }, warningTime);
    }

    // 로그아웃 타이머
    if (timeRemaining > 0) {
      this.logoutTimer = setTimeout(() => {
        this.handleSessionExpired();
      }, timeRemaining);
    }
  }

  /**
   * 세션 타이머 정리
   */
  private clearSessionTimers(): void {
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
      this.logoutTimer = null;
    }
  }

  /**
   * 세션 경고 처리
   */
  private handleSessionWarning(): void {
    if (!this.currentSession) return;

    this.recordSessionEvent('warning', {
      timeRemaining: this.currentSession.expiresAt - Date.now()
    });

    // 경고 이벤트 발생
    this.dispatchSessionEvent('warning', {
      timeRemaining: this.currentSession.expiresAt - Date.now(),
      message: `세션이 ${this.sessionConfig.warningMinutes}분 후에 만료됩니다.`
    });

    console.log(`⚠️ 세션 경고: ${this.currentSession.sessionId}`);
  }

  /**
   * 세션 만료 처리
   */
  private handleSessionExpired(): void {
    if (!this.currentSession) return;

    // sessionId를 미리 저장 (performAutoLogout에서 null이 될 수 있음)
    const sessionId = this.currentSession.sessionId;

    this.recordSessionEvent('expired');

    // 만료 이벤트 발생
    this.dispatchSessionEvent('expired', {
      message: '세션이 만료되었습니다.'
    });

    // 자동 로그아웃
    if (this.sessionConfig.autoLogout) {
      this.performAutoLogout();
    }

    // sessionId는 이미 저장했으므로 안전하게 사용 가능
    console.log(`⏰ 세션 만료: ${sessionId}`);
  }

  /**
   * 자동 로그아웃 수행
   */
  private performAutoLogout(): void {
    try {
      // AuthService를 통한 로그아웃
      AuthService.logout();

      // 세션 종료
      this.endSession();

      // 로그아웃 이벤트 발생
      this.dispatchSessionEvent('logout', {
        reason: 'auto_logout',
        message: '세션 만료로 인한 자동 로그아웃'
      });

      console.log('🚪 자동 로그아웃 수행');
    } catch (error) {
      console.error('자동 로그아웃 실패:', error);
    }
  }

  /**
   * 활동 리스너 초기화
   */
  private initializeActivityListeners(): void {
    const activities = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    const handleActivity = () => {
      this.recordActivity();
    };

    activities.forEach(activity => {
      document.addEventListener(activity, handleActivity, true);
    });

    // 페이지 가시성 변경 감지
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.recordActivity();
      }
    });

    // 페이지 포커스 변경 감지
    window.addEventListener('focus', () => {
      this.recordActivity();
    });
  }

  /**
   * 활동 기록
   */
  private recordActivity(): void {
    if (!this.currentSession || !this.currentSession.isActive) {
      return;
    }

    const now = Date.now();
    const timeSinceLastActivity = now - this.currentSession.lastActivity;

    // 1분 이상 활동이 없었을 때만 기록
    if (timeSinceLastActivity >= 60 * 1000) {
      this.currentSession.lastActivity = now;
      this.saveSession();
      this.recordSessionEvent('activity', {
        timeSinceLastActivity
      });
    }
  }

  /**
   * 세션 이벤트 디스패치
   */
  private dispatchSessionEvent(type: string, data: any): void {
    const event = new CustomEvent('sessionEvent', {
      detail: { type, data }
    });
    window.dispatchEvent(event);
  }

  /**
   * 세션 저장
   */
  private saveSession(): void {
    if (this.currentSession) {
      localStorage.setItem('current_session', JSON.stringify(this.currentSession));
    }
  }

  /**
   * 세션 로드
   */
  loadSession(): SessionInfo | null {
    try {
      const sessionData = localStorage.getItem('current_session');
      if (sessionData) {
        this.currentSession = JSON.parse(sessionData);
        
        // 세션 유효성 확인
        const status = this.checkSessionStatus();
        if (!status.isValid) {
          this.endSession();
          return null;
        }

        // 타이머 재설정
        this.setupSessionTimers();
        
        return this.currentSession;
      }
      return null;
    } catch (error) {
      console.error('세션 로드 실패:', error);
      return null;
    }
  }

  /**
   * 세션 설정 저장
   */
  private saveSessionConfig(): void {
    localStorage.setItem('session_config', JSON.stringify(this.sessionConfig));
  }

  /**
   * 세션 설정 로드
   */
  private loadSessionConfig(): void {
    try {
      const configData = localStorage.getItem('session_config');
      if (configData) {
        this.sessionConfig = { ...this.sessionConfig, ...JSON.parse(configData) };
      }
    } catch (error) {
      console.error('세션 설정 로드 실패:', error);
    }
  }

  /**
   * 세션 이벤트 저장
   */
  private saveSessionEvents(): void {
    localStorage.setItem('session_events', JSON.stringify(this.sessionEvents));
  }

  /**
   * 세션 이벤트 로드
   */
  loadSessionEvents(): void {
    try {
      const eventsData = localStorage.getItem('session_events');
      if (eventsData) {
        this.sessionEvents = JSON.parse(eventsData);
      }
    } catch (error) {
      console.error('세션 이벤트 로드 실패:', error);
    }
  }

  /**
   * 세션 통계 조회
   */
  getSessionStats(): {
    totalSessions: number;
    averageSessionDuration: number;
    longestSession: number;
    shortestSession: number;
    totalActivity: number;
  } {
    const events = this.getSessionEvents();
    const loginEvents = events.filter(e => e.type === 'login');
    const logoutEvents = events.filter(e => e.type === 'logout');
    
    let totalSessions = 0;
    let totalDuration = 0;
    let longestSession = 0;
    let shortestSession = Infinity;
    let totalActivity = events.filter(e => e.type === 'activity').length;

    // 세션별 지속 시간 계산
    for (let i = 0; i < loginEvents.length; i++) {
      const loginEvent = loginEvents[i];
      const logoutEvent = logoutEvents.find(e => 
        e.sessionId === loginEvent.sessionId && 
        e.timestamp > loginEvent.timestamp
      );

      if (logoutEvent) {
        const duration = logoutEvent.timestamp - loginEvent.timestamp;
        totalDuration += duration;
        longestSession = Math.max(longestSession, duration);
        shortestSession = Math.min(shortestSession, duration);
        totalSessions++;
      }
    }

    return {
      totalSessions,
      averageSessionDuration: totalSessions > 0 ? totalDuration / totalSessions : 0,
      longestSession,
      shortestSession: shortestSession === Infinity ? 0 : shortestSession,
      totalActivity
    };
  }

  /**
   * 세션 정리
   */
  cleanupSessions(): void {
    try {
      // 오래된 세션 이벤트 정리 (30일 이상)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      this.sessionEvents = this.sessionEvents.filter(e => e.timestamp > thirtyDaysAgo);
      
      this.saveSessionEvents();
      console.log('🧹 세션 정리 완료');
    } catch (error) {
      console.error('세션 정리 실패:', error);
    }
  }
}

export const sessionManagementService = SessionManagementService.getInstance();
