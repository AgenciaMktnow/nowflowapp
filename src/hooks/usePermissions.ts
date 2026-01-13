import { useAuth } from '../contexts/AuthContext';
import type { IUserProfile } from '../types/auth';
import { PLANS, type PlanType, type FeatureKey } from '../constants/plans';

export const usePermissions = () => {
    const { userProfile: rawProfile } = useAuth();
    const userProfile = rawProfile as IUserProfile | null;

    // Default to FREE if no plan found (safety fallback)
    const currentPlan: PlanType = (userProfile?.organization?.plan_type as PlanType) || 'FREE';
    const planLimits = PLANS[currentPlan];

    const checkPermission = (feature: FeatureKey): boolean => {
        // God Mode bypass (optional, if needed for super admins)
        // if (userProfile?.role === 'ADMIN' && isStartUser) return true;

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
