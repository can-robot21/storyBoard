import { AuthService } from './authService';
import { dataAccessControlService } from './dataAccessControlService';

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: any;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  result: 'success' | 'failure' | 'warning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'auth' | 'data' | 'system' | 'security' | 'api';
}

export interface AuditTrail {
  id: string;
  userId: string;
  action: string;
  beforeData?: any;
  afterData?: any;
  changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  timestamp: number;
  reason?: string;
  approvedBy?: string;
}

export interface ActivityStats {
  totalActivities: number;
  activitiesByCategory: { [category: string]: number };
  activitiesByResult: { [result: string]: number };
  activitiesBySeverity: { [severity: string]: number };
  recentActivities: ActivityLog[];
  suspiciousActivities: ActivityLog[];
}

export class UserActivityLogService {
  private static instance: UserActivityLogService;
  private activityLogs: ActivityLog[] = [];
  private auditTrails: AuditTrail[] = [];
  private readonly MAX_LOG_SIZE = 10000;
  private readonly MAX_AUDIT_TRAIL_SIZE = 5000;

  static getInstance(): UserActivityLogService {
    if (!UserActivityLogService.instance) {
      UserActivityLogService.instance = new UserActivityLogService();
    }
    return UserActivityLogService.instance;
  }

  constructor() {
    this.loadActivityLogs();
    this.loadAuditTrails();
  }

  /**
   * 활동 로그 기록
   */
  logActivity(
    userId: string,
    action: string,
    resource: string,
    details: any,
    options?: {
      resourceId?: string;
      result?: 'success' | 'failure' | 'warning';
      severity?: 'low' | 'medium' | 'high' | 'critical';
      category?: 'auth' | 'data' | 'system' | 'security' | 'api';
      sessionId?: string;
    }
  ): void {
    try {
      const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      const activityLog: ActivityLog = {
        id: logId,
        userId,
        action,
        resource,
        resourceId: options?.resourceId,
        details,
        timestamp: Date.now(),
        ipAddress: 'localhost', // 실제로는 클라이언트 IP
        userAgent: navigator.userAgent,
        sessionId: options?.sessionId,
        result: options?.result || 'success',
        severity: options?.severity || 'low',
        category: options?.category || 'data'
      };

      this.activityLogs.push(activityLog);

      // 로그 크기 제한
      if (this.activityLogs.length > this.MAX_LOG_SIZE) {
        this.activityLogs = this.activityLogs.slice(-this.MAX_LOG_SIZE);
      }

      this.saveActivityLogs();

      // 의심스러운 활동 감지
      this.detectSuspiciousActivity(activityLog);

      console.log(`📝 활동 로그 기록: ${action} (${resource})`);
    } catch (error) {
      console.error('활동 로그 기록 실패:', error);
    }
  }

  /**
   * 감사 추적 기록
   */
  logAuditTrail(
    userId: string,
    action: string,
    beforeData: any,
    afterData: any,
    options?: {
      reason?: string;
      approvedBy?: string;
    }
  ): void {
    try {
      const trailId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      
      // 변경사항 분석
      const changes = this.analyzeChanges(beforeData, afterData);
      
      const auditTrail: AuditTrail = {
        id: trailId,
        userId,
        action,
        beforeData,
        afterData,
        changes,
        timestamp: Date.now(),
        reason: options?.reason,
        approvedBy: options?.approvedBy
      };

      this.auditTrails.push(auditTrail);

      // 감사 추적 크기 제한
      if (this.auditTrails.length > this.MAX_AUDIT_TRAIL_SIZE) {
        this.auditTrails = this.auditTrails.slice(-this.MAX_AUDIT_TRAIL_SIZE);
      }

      this.saveAuditTrails();

      console.log(`🔍 감사 추적 기록: ${action} (${changes.length}개 변경사항)`);
    } catch (error) {
      console.error('감사 추적 기록 실패:', error);
    }
  }

  /**
   * 변경사항 분석
   */
  private analyzeChanges(beforeData: any, afterData: any): Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }> {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }> = [];

    try {
      const before = typeof beforeData === 'string' ? JSON.parse(beforeData) : beforeData;
      const after = typeof afterData === 'string' ? JSON.parse(afterData) : afterData;

      // 객체 비교
      const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
      
      allKeys.forEach(key => {
        const oldValue = before?.[key];
        const newValue = after?.[key];
        
        if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
          changes.push({
            field: key,
            oldValue,
            newValue
          });
        }
      });
    } catch (error) {
      console.error('변경사항 분석 실패:', error);
    }

    return changes;
  }

  /**
   * 의심스러운 활동 감지
   */
  private detectSuspiciousActivity(activityLog: ActivityLog): void {
    try {
      const suspiciousPatterns = [
        // 1. 짧은 시간 내 많은 실패 시도
        {
          pattern: 'multiple_failures',
          check: () => {
            const recentFailures = this.activityLogs
              .filter(log => 
                log.userId === activityLog.userId &&
                log.result === 'failure' &&
                (Date.now() - log.timestamp) < 5 * 60 * 1000 // 5분
              );
            return recentFailures.length >= 5;
          },
          severity: 'high'
        },
        // 2. 비정상적인 시간대 활동
        {
          pattern: 'unusual_time',
          check: () => {
            const hour = new Date(activityLog.timestamp).getHours();
            return hour < 6 || hour > 23; // 새벽 6시 이전 또는 밤 11시 이후
          },
          severity: 'medium'
        },
        // 3. 대량 데이터 접근
        {
          pattern: 'bulk_data_access',
          check: () => {
            return activityLog.action.includes('bulk') || 
                   activityLog.action.includes('export') ||
                   activityLog.action.includes('delete_all');
          },
          severity: 'high'
        },
        // 4. 권한 변경 시도
        {
          pattern: 'permission_change',
          check: () => {
            return activityLog.resource === 'permission' || 
                   activityLog.resource === 'role' ||
                   activityLog.action.includes('grant') ||
                   activityLog.action.includes('revoke');
          },
          severity: 'critical'
        }
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.check()) {
          this.logActivity(
            activityLog.userId,
            'suspicious_activity_detected',
            'security',
            {
              pattern: pattern.pattern,
              originalActivity: activityLog,
              detectedAt: Date.now()
            },
            {
              result: 'warning',
              severity: pattern.severity as any,
              category: 'security'
            }
          );

          console.warn(`🚨 의심스러운 활동 감지: ${pattern.pattern} (${activityLog.userId})`);
        }
      }
    } catch (error) {
      console.error('의심스러운 활동 감지 실패:', error);
    }
  }

  /**
   * 활동 로그 조회
   */
  getActivityLogs(
    userId?: string,
    options?: {
      category?: string;
      severity?: string;
      startDate?: number;
      endDate?: number;
      limit?: number;
    }
  ): ActivityLog[] {
    let logs = [...this.activityLogs];

    // 필터링
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    if (options?.category) {
      logs = logs.filter(log => log.category === options.category);
    }
    if (options?.severity) {
      logs = logs.filter(log => log.severity === options.severity);
    }
    if (options?.startDate) {
      logs = logs.filter(log => log.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      logs = logs.filter(log => log.timestamp <= options.endDate!);
    }

    // 정렬 (최신순)
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // 제한
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  }

  /**
   * 감사 추적 조회
   */
  getAuditTrails(
    userId?: string,
    options?: {
      action?: string;
      startDate?: number;
      endDate?: number;
      limit?: number;
    }
  ): AuditTrail[] {
    let trails = [...this.auditTrails];

    // 필터링
    if (userId) {
      trails = trails.filter(trail => trail.userId === userId);
    }
    if (options?.action) {
      trails = trails.filter(trail => trail.action === options.action);
    }
    if (options?.startDate) {
      trails = trails.filter(trail => trail.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      trails = trails.filter(trail => trail.timestamp <= options.endDate!);
    }

    // 정렬 (최신순)
    trails.sort((a, b) => b.timestamp - a.timestamp);

    // 제한
    if (options?.limit) {
      trails = trails.slice(0, options.limit);
    }

    return trails;
  }

  /**
   * 활동 통계 조회
   */
  getActivityStats(userId?: string): ActivityStats {
    const logs = userId ? this.getActivityLogs(userId) : this.activityLogs;
    
    const activitiesByCategory: { [category: string]: number } = {};
    const activitiesByResult: { [result: string]: number } = {};
    const activitiesBySeverity: { [severity: string]: number } = {};
    
    logs.forEach(log => {
      activitiesByCategory[log.category] = (activitiesByCategory[log.category] || 0) + 1;
      activitiesByResult[log.result] = (activitiesByResult[log.result] || 0) + 1;
      activitiesBySeverity[log.severity] = (activitiesBySeverity[log.severity] || 0) + 1;
    });

    // 최근 활동 (최근 50개)
    const recentActivities = logs.slice(0, 50);

    // 의심스러운 활동
    const suspiciousActivities = logs.filter(log => 
      log.severity === 'high' || log.severity === 'critical'
    );

    return {
      totalActivities: logs.length,
      activitiesByCategory,
      activitiesByResult,
      activitiesBySeverity,
      recentActivities,
      suspiciousActivities
    };
  }

  /**
   * 활동 로그 내보내기
   */
  exportActivityLogs(
    userId?: string,
    options?: {
      format?: 'json' | 'csv';
      startDate?: number;
      endDate?: number;
    }
  ): string {
    try {
      const logs = this.getActivityLogs(userId, options);
      
      if (options?.format === 'csv') {
        // CSV 형식으로 내보내기
        const headers = ['ID', 'User ID', 'Action', 'Resource', 'Result', 'Severity', 'Category', 'Timestamp'];
        const rows = logs.map(log => [
          log.id,
          log.userId,
          log.action,
          log.resource,
          log.result,
          log.severity,
          log.category,
          new Date(log.timestamp).toISOString()
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      } else {
        // JSON 형식으로 내보내기
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('활동 로그 내보내기 실패:', error);
      return '';
    }
  }

  /**
   * 감사 추적 내보내기
   */
  exportAuditTrails(
    userId?: string,
    options?: {
      format?: 'json' | 'csv';
      startDate?: number;
      endDate?: number;
    }
  ): string {
    try {
      const trails = this.getAuditTrails(userId, options);
      
      if (options?.format === 'csv') {
        // CSV 형식으로 내보내기
        const headers = ['ID', 'User ID', 'Action', 'Changes Count', 'Timestamp', 'Reason'];
        const rows = trails.map(trail => [
          trail.id,
          trail.userId,
          trail.action,
          trail.changes.length.toString(),
          new Date(trail.timestamp).toISOString(),
          trail.reason || ''
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
      } else {
        // JSON 형식으로 내보내기
        return JSON.stringify(trails, null, 2);
      }
    } catch (error) {
      console.error('감사 추적 내보내기 실패:', error);
      return '';
    }
  }

  /**
   * 활동 로그 정리
   */
  cleanupActivityLogs(daysToKeep: number = 30): void {
    try {
      const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      const beforeCount = this.activityLogs.length;
      this.activityLogs = this.activityLogs.filter(log => log.timestamp > cutoffDate);
      const afterCount = this.activityLogs.length;
      
      this.saveActivityLogs();
      
      console.log(`🧹 활동 로그 정리 완료: ${beforeCount - afterCount}개 로그 삭제`);
    } catch (error) {
      console.error('활동 로그 정리 실패:', error);
    }
  }

  /**
   * 감사 추적 정리
   */
  cleanupAuditTrails(daysToKeep: number = 90): void {
    try {
      const cutoffDate = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
      
      const beforeCount = this.auditTrails.length;
      this.auditTrails = this.auditTrails.filter(trail => trail.timestamp > cutoffDate);
      const afterCount = this.auditTrails.length;
      
      this.saveAuditTrails();
      
      console.log(`🧹 감사 추적 정리 완료: ${beforeCount - afterCount}개 추적 삭제`);
    } catch (error) {
      console.error('감사 추적 정리 실패:', error);
    }
  }

  /**
   * 활동 로그 저장
   */
  private saveActivityLogs(): void {
    try {
      localStorage.setItem('activity_logs', JSON.stringify(this.activityLogs));
    } catch (error) {
      console.error('활동 로그 저장 실패:', error);
    }
  }

  /**
   * 활동 로그 로드
   */
  private loadActivityLogs(): void {
    try {
      const logsData = localStorage.getItem('activity_logs');
      if (logsData) {
        this.activityLogs = JSON.parse(logsData);
      }
    } catch (error) {
      console.error('활동 로그 로드 실패:', error);
    }
  }

  /**
   * 감사 추적 저장
   */
  private saveAuditTrails(): void {
    try {
      localStorage.setItem('audit_trails', JSON.stringify(this.auditTrails));
    } catch (error) {
      console.error('감사 추적 저장 실패:', error);
    }
  }

  /**
   * 감사 추적 로드
   */
  private loadAuditTrails(): void {
    try {
      const trailsData = localStorage.getItem('audit_trails');
      if (trailsData) {
        this.auditTrails = JSON.parse(trailsData);
      }
    } catch (error) {
      console.error('감사 추적 로드 실패:', error);
    }
  }

  /**
   * 실시간 활동 모니터링 시작
   */
  startRealTimeMonitoring(): void {
    // 페이지 이벤트 모니터링
    const events = [
      'click',
      'keydown',
      'scroll',
      'resize',
      'focus',
      'blur'
    ];

    events.forEach(event => {
      document.addEventListener(event, (e) => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          this.logActivity(
            currentUser.id,
            `page_${event}`,
            'ui',
            {
              target: (e.target as HTMLElement)?.tagName,
              timestamp: Date.now()
            },
            {
              category: 'system',
              severity: 'low'
            }
          );
        }
      }, true);
    });

    console.log('📊 실시간 활동 모니터링 시작');
  }

  /**
   * 실시간 활동 모니터링 중지
   */
  stopRealTimeMonitoring(): void {
    // 이벤트 리스너 제거는 복잡하므로 간단한 구현
    console.log('⏹️ 실시간 활동 모니터링 중지');
  }
}

export const userActivityLogService = UserActivityLogService.getInstance();
