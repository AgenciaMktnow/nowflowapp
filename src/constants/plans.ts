export const PLANS = {
    FREE: {
        max_users: 3,
        storage_limit_mb: 500,
        features: {
            auto_pause: false,
            workload_management: false,
            custom_workflows: false,
            advanced_reports: false,
            churn_prediction: false,
        }
    },
    STARTER: {
        max_users: 9999, // "Unlimited" practically, billing governed
        storage_limit_mb: 5000,
        features: {
            auto_pause: false,
            workload_management: false,
            custom_workflows: true,
            advanced_reports: false, // "Relatórios Básicos" vs Pro "Dashboards"
            churn_prediction: false,
        }
    },
    PRO: {
        max_users: 9999,
        storage_limit_mb: 25000,
        features: {
            auto_pause: true,
            workload_management: true,
            custom_workflows: true,
            advanced_reports: true,
            churn_prediction: true,
        }
    },
    ENTERPRISE: {
        max_users: 99999,
        storage_limit_mb: 1000000,
        features: {
            auto_pause: true,
            workload_management: true,
            custom_workflows: true,
            advanced_reports: true,
            churn_prediction: true,
        }
    }
} as const;

export type PlanType = keyof typeof PLANS;
export type FeatureKey = keyof typeof PLANS.PRO.features;
