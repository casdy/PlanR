/**
 * @file src/pages/Login.tsx
 * @description Email/password login page.
 *
 * Shows a success SplashScreen for 2.5s before navigating to the Dashboard
 * once authentication completes. Also provides a Google OAuth button and a
 * link to the SignUp page for new users.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { SplashScreen } from '../components/SplashScreen';
import { useLanguage } from '../hooks/useLanguage';

export const Login = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessSplash, setShowSuccessSplash] = useState(false);
    
    const { login, resetApp, continueAsGuest } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await login(email, password);
            setShowSuccessSplash(true);
            setTimeout(() => navigate('/'), 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <SplashScreen show={showSuccessSplash} message={t('welcome_back')} />
            
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary glow-primary mb-6"
                    >
                        <LogIn className="w-10 h-10 text-primary-foreground" />
                    </motion.div>
                    <h2 className="text-4xl font-black tracking-tight mb-2">{t('welcome_back')}</h2>
                    <p className="text-muted-foreground font-medium">{t('login_subtitle')}</p>
                </div>

                <form onSubmit={handleSubmit} className="glass p-8 rounded-[2.5rem] border-white/20 dark:border-white/5 space-y-6">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold p-4 rounded-2xl text-center">
                            {error}
                        </div>
                    )}

                    <Input
                        id="email"
                        name="email"
                        label={t('email_address')}
                        placeholder="your@email.com"
                        type="email"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />

                    <Input
                        id="password"
                        name="password"
                        label={t('password')}
                        placeholder="••••••••"
                        type="password"
                        icon={Lock}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-14 rounded-2xl text-lg font-bold group"
                        >
                            {isLoading ? t('authenticating') : (
                                <>
                                    {t('log_in_link')}
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>


                    <Button
                        type="button"
                        onClick={() => {
                            continueAsGuest();
                            setShowSuccessSplash(true);
                            setTimeout(() => navigate('/'), 2500);
                        }}
                        variant="outline"
                        className="w-full h-14 rounded-2xl text-lg font-bold border-2 border-primary/20 text-foreground hover:bg-primary/5 dark:border-white/10 dark:hover:bg-white/5 transition-all"
                    >
                        {t('continue_as_guest')}
                    </Button>
                </form>

                <div className="mt-8 text-center space-y-4">
                    <p className="text-muted-foreground font-medium">
                        {t('dont_have_account')} {' '}
                        <Link to="/signup" className="text-primary hover:underline font-bold decoration-2 underline-offset-4">
                            {t('sign_up_now')}
                        </Link>
                    </p>
                    
                    <div>
                        <button 
                            onClick={async () => {
                                if (confirm(t('trouble_logging_in'))) {
                                    await resetApp();
                                }
                            }}
                            className="text-xs font-black uppercase tracking-widest text-muted-foreground/30 hover:text-primary transition-colors"
                        >
                            {t('reset_app_data_trouble')}
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
