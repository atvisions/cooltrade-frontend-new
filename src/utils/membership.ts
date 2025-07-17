import { membership, pointsApi } from '@/api'

// 会员状态接口
export interface MembershipStatus {
  is_premium_active: boolean
  points: number
  membership_status: 'regular' | 'premium'
  premium_expires_at?: string
}

// 权限检查结果接口
export interface PermissionCheckResult {
  hasAccess: boolean
  reason: 'premium' | 'points' | 'insufficient_points' | 'not_logged_in'
  pointsRequired?: number
  currentPoints?: number
}

// 会员权限验证类
export class MembershipValidator {
  private static instance: MembershipValidator
  private membershipStatus: MembershipStatus | null = null
  private lastFetchTime: number = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  private constructor() {}

  public static getInstance(): MembershipValidator {
    if (!MembershipValidator.instance) {
      MembershipValidator.instance = new MembershipValidator()
    }
    return MembershipValidator.instance
  }

  /**
   * 获取用户会员状态
   */
  public async getMembershipStatus(forceRefresh = false): Promise<MembershipStatus | null> {
    const now = Date.now()
    
    // 如果有缓存且未过期，直接返回缓存
    if (!forceRefresh && this.membershipStatus && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return this.membershipStatus
    }

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        this.membershipStatus = null
        return null
      }

      const response = await membership.getStatus()
      if (response.status === 'success' && response.data) {
        this.membershipStatus = {
          is_premium_active: response.data.is_premium_active,
          points: response.data.points,
          membership_status: response.data.membership_status,
          premium_expires_at: response.data.premium_expires_at
        }
        this.lastFetchTime = now
        return this.membershipStatus
      }
    } catch (error) {
      console.warn('获取会员状态失败:', error)
    }

    return null
  }

  /**
   * 检查是否有权限访问高级功能
   */
  public async checkPremiumAccess(pointsRequired = 10): Promise<PermissionCheckResult> {
    const status = await this.getMembershipStatus()
    
    if (!status) {
      return {
        hasAccess: false,
        reason: 'not_logged_in'
      }
    }

    // 如果是高级会员，直接允许访问
    if (status.is_premium_active) {
      return {
        hasAccess: true,
        reason: 'premium'
      }
    }

    // 检查积分是否足够
    if (status.points >= pointsRequired) {
      return {
        hasAccess: true,
        reason: 'points',
        pointsRequired,
        currentPoints: status.points
      }
    }

    // 积分不足
    return {
      hasAccess: false,
      reason: 'insufficient_points',
      pointsRequired,
      currentPoints: status.points
    }
  }

  /**
   * 消费积分访问高级功能
   */
  public async spendPointsForAccess(pointsRequired = 10): Promise<boolean> {
    try {
      const response = await pointsApi.spendPoints()
      if (response.status === 'success') {
        // 更新本地缓存的积分 - 根据后端实际响应结构访问
        if (this.membershipStatus) {
          this.membershipStatus.points = (response as any).remaining_points
        }
        return true
      }
    } catch (error) {
      console.error('消费积分失败:', error)
    }
    return false
  }

  /**
   * 检查会员是否即将过期（7天内）
   */
  public checkMembershipExpiring(): boolean {
    if (!this.membershipStatus || !this.membershipStatus.is_premium_active || !this.membershipStatus.premium_expires_at) {
      return false
    }

    const expiresAt = new Date(this.membershipStatus.premium_expires_at)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  /**
   * 获取会员到期天数
   */
  public getDaysUntilExpiry(): number | null {
    if (!this.membershipStatus || !this.membershipStatus.is_premium_active || !this.membershipStatus.premium_expires_at) {
      return null
    }

    const expiresAt = new Date(this.membershipStatus.premium_expires_at)
    const now = new Date()
    return Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * 清除缓存
   */
  public clearCache(): void {
    this.membershipStatus = null
    this.lastFetchTime = 0
  }

  /**
   * 更新本地会员状态（用于支付成功后立即更新）
   */
  public updateMembershipStatus(status: Partial<MembershipStatus>): void {
    if (this.membershipStatus) {
      this.membershipStatus = { ...this.membershipStatus, ...status }
    }
  }
}

// 导出单例实例
export const membershipValidator = MembershipValidator.getInstance()

// 便捷函数
export const checkPremiumAccess = (pointsRequired = 10) => membershipValidator.checkPremiumAccess(pointsRequired)
export const getMembershipStatus = (forceRefresh = false) => membershipValidator.getMembershipStatus(forceRefresh)
export const spendPointsForAccess = (pointsRequired = 10) => membershipValidator.spendPointsForAccess(pointsRequired)
export const checkMembershipExpiring = () => membershipValidator.checkMembershipExpiring()
export const getDaysUntilExpiry = () => membershipValidator.getDaysUntilExpiry()
export const clearMembershipCache = () => membershipValidator.clearCache()
export const updateMembershipStatus = (status: Partial<MembershipStatus>) => membershipValidator.updateMembershipStatus(status)

// 权限守卫 Hook
export const useMembershipGuard = () => {
  return {
    checkAccess: checkPremiumAccess,
    getStatus: getMembershipStatus,
    spendPoints: spendPointsForAccess,
    isExpiring: checkMembershipExpiring,
    daysLeft: getDaysUntilExpiry,
    clearCache: clearMembershipCache,
    updateStatus: updateMembershipStatus
  }
}
