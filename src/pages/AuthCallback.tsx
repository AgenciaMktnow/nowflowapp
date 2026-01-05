import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
    const navigate = useNavigate();

    useEffect(() => {
        // Handle the redirect logic
        const handleAuthRedirect = async () => {
            console.log("AuthCallback: Processing auth callback...");

            // Check session explicity
            const { data: { session }, error } = await supabase.auth.getSession();
            console.log("AuthCallback: Current Session:", { email: session?.user?.email, error });

            if (error) {
                console.error("AuthCallback: Error getting session:", error);
                // If error, maybe redirect to login? Or wait?
            }

            // Check specifically for password recovery flow in URL
            // This is the most reliable way as onAuthStateChange might trigger SIGNED_IN first
            const hash = window.location.hash;
            if (hash && hash.includes('type=recovery')) {
                console.log("AuthCallback: Recovery type detected in hash. Redirecting to reset password.");
                navigate('/reset-password');
                return;
            }

            // Fallback to detecting session state changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
                console.log(`AuthCallback: Event detected: ${event}`);

                if (event === 'PASSWORD_RECOVERY') {
                    console.log("AuthCallback: PASSWORD_RECOVERY event. Redirecting to reset password.");
                    navigate('/reset-password');
                } else if (event === 'SIGNED_IN') {
                    console.log("AuthCallback: SIGNED_IN event. Redirecting to dashboard.");
                    navigate('/');
                }
            });

            // Clean up subscription
            return () => {
                subscription.unsubscribe();
            };
        };

        handleAuthRedirect();
    }, [navigate]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background-dark text-white flex-col gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-text-secondary animate-pulse">Autenticando...</p>
        </div>
    );
}
