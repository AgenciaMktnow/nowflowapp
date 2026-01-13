import { useAuth } from '../contexts/AuthContext';
import type { IUserProfile } from '../types/auth';
import { PLANS, type PlanType, type FeatureKey } from '../constants/plans';

export const usePermissions = () => {
    const { userProfile: rawProfile, isSuperAdmin } = useAuth();
    const userProfile = rawProfile as IUserProfile | null;

    // Default to PRO if no plan found (safer fallback for legacy users during migration)
    const currentPlan: PlanType = (userProfile?.organization?.plan_type as PlanType) || 'PRO';
    const planLimits = isSuperAdmin ? {
        ...PLANS['ENTERPRISE'],
        max_users: 999999,
        storage_limit_mb: 999999,
    } : PLANS[currentPlan];

    const checkPermission = (feature: FeatureKey): boolean => {
        if (isSuperAdmin) return true;
        return planLimits.features[feature];
    };

    const getPlanLimit = (limit: 'max_users' | 'storage_limit_mb') => {
        return planLimits[limit];
    };

    return {
        plan: currentPlan,
        limits: planLimits,
        can: checkPermission,
        getLimit: getPlanLimit,
        isPro: currentPlan === 'PRO' || currentPlan === 'ENTERPRISE'
    };
};
