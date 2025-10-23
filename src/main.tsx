import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import React, { lazy, useEffect, useRef, useState, Suspense } from 'react';
import App from './app/App.tsx';
import './styles/index.css';
import { AppProviders } from './app/providers/AppProviders';
import { logEnvConfig, env, validateEnvironment } from './system/env';
import { logSupabaseConfig } from './system/supabase/client';
import logger from './lib/utils/logger';
import { logMealScannerFeatureFlags } from './config/featureFlags';

// Validate environment variables at startup (critical for security)
try {
  validateEnvironment();
} catch (error) {
  logger.error('STARTUP', 'Environment validation failed - application cannot start', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  // Show error screen in production
  if (import.meta.env.PROD) {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #0B0E17; color: white; font-family: system-ui; padding: 2rem;">
        <div style="max-width: 600px; text-align: center;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">Configuration Error</h1>
          <p style="color: #FF6B6B; margin-bottom: 1rem;">The application is not properly configured. Please contact support.</p>
          <p style="color: #888; font-size: 0.875rem;">Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    `;
    throw error;
  }
}
import { supabase } from './system/supabase/client';
import { AuthForm } from './app/components/AuthForm';
import { LoadingFallback } from './app/components/LoadingFallback';
import { useUserStore } from './system/store/userStore';

const Home = lazy(() => import('./app/pages/Home'));
const Profile = lazy(() => import('./app/pages/Profile'));
const ActivityPage = lazy(() => import('./app/pages/ActivityPage'));
const FastingPage = lazy(() => import('./app/pages/Fasting/FastingPage'));
// Placeholder pages removed for optimization
const TrainingPage = lazy(() => import('./app/pages/TrainingPage'));
const TrainingPipelinePage = lazy(() => import('./app/pages/Training/Pipeline/TrainingPipelinePage'));
const SettingsPage = lazy(() => import('./app/pages/SettingsPage'));
const NotificationsPage = lazy(() => import('./app/pages/NotificationsPage'));
// Body scan and avatar placeholder pages removed
const ActivityInputPage = lazy(() => import('./app/pages/Activity/ActivityInputPage'));
const FastingInputPage = lazy(() => import('./app/pages/Fasting/FastingInputPage'));
const DevCachePage = lazy(() => import('./app/pages/DevCachePage'));

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [user, setUser] = useState<any>(null);
  const initRef = useRef(false);
  const { setSession, setAuthReady } = useUserStore();
  
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initializeAuth = async () => {
      try {
        logger.debug('AUTH', 'Starting authentication initialization');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          logger.debug('AUTH', 'Found existing session');
          setUser(session.user);
          setShowAuthForm(false);
          setSession(session);
          setAuthReady(true);
        } else {
          logger.debug('AUTH', 'No session found, showing auth form');
          setShowAuthForm(true);
          setSession(null);
          setAuthReady(false);
        }
      } catch (error) {
        logger.error('AUTH', 'Error during initialization', { error });
        setShowAuthForm(true);
        setSession(null);
        setAuthReady(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.debug('AUTH', 'Auth state changed', { event, hasSession: !!session });

      if (event === 'SIGNED_OUT') {
        logger.info('AUTH', 'User signed out, redirecting to auth form');
        setUser(null);
        setShowAuthForm(true);
        setSession(null);
        setAuthReady(false);
        setIsLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setShowAuthForm(false);
        setSession(session);
        setAuthReady(true);
      } else {
        setUser(null);
        setShowAuthForm(true);
        setSession(null);
        setAuthReady(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <LoadingFallback title="Bienvenue sur TwinForge" subtitle="Vérification de votre session..." />;
  }

  if (showAuthForm) {
    return <AuthForm onSuccess={() => window.location.href = '/'} />;
  }

  return <>{children}</>;
}

// Create the router with data router API
const router = createBrowserRouter([
  {
    path: "/",
    element: <AuthWrapper><App /></AuthWrapper>,
    children: [
      {
        index: true,
        element: <Suspense fallback={<LoadingFallback />}><Home /></Suspense>
      },
      {
        path: "profile",
        element: <Suspense fallback={<LoadingFallback />}><Profile /></Suspense>
      },
      // Meals routes removed - placeholder feature
      {
        path: "activity",
        element: <Suspense fallback={<LoadingFallback />}><ActivityPage /></Suspense>
      },
      {
        path: "activity/input",
        element: <Suspense fallback={<LoadingFallback />}><ActivityInputPage /></Suspense>
      },
      {
        path: "fasting",
        element: <Suspense fallback={<LoadingFallback />}><FastingPage /></Suspense>
      },
      {
        path: "fasting/input",
        element: <Suspense fallback={<LoadingFallback />}><FastingInputPage /></Suspense>
      },
      // Fridge routes removed - placeholder feature
      {
        path: "training",
        element: <Suspense fallback={<LoadingFallback />}><TrainingPage /></Suspense>
      },
      {
        path: "training/pipeline",
        element: <Suspense fallback={<LoadingFallback />}><TrainingPipelinePage /></Suspense>
      },
      {
        path: "settings",
        element: <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>
      },
      {
        path: "notifications",
        element: <Suspense fallback={<LoadingFallback />}><NotificationsPage /></Suspense>
      },
      // Avatar, body-scan, vital routes removed - placeholder features
      {
        path: "dev/cache",
        element: <Suspense fallback={<LoadingFallback />}><DevCachePage /></Suspense>
      },
      // Logo gallery route removed
    ]
  }
]);

const enableStrictMode = import.meta.env.DEV && import.meta.env.VITE_ENABLE_STRICT_MODE !== 'false';

const app = (
  <AppProviders>
    <RouterProvider router={router} />
  </AppProviders>
);

createRoot(document.getElementById('root')!).render(
  enableStrictMode ? <StrictMode>{app}</StrictMode> : app
);

logger.info('APP', 'React app initialized', {
  strictMode: enableStrictMode,
  env: import.meta.env.MODE
});

// Load voice diagnostics in development mode
if (import.meta.env.DEV) {
  import('./system/services/voiceDiagnosticRunner').then(() => {
    console.log('%c💡 Voice Diagnostics Available', 'color: #4CAF50; font-weight: bold; font-size: 14px');
    console.log('Run in console: runVoiceDiagnostics() or quickVoiceCheck()');
  }).catch(err => {
    logger.warn('APP', 'Failed to load voice diagnostics', { error: err });
  });
}
