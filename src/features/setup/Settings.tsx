import Link from 'next/link';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { SettingsSection, FormField, StatusText, type Status } from './components/SettingsComponents';
import HealthWebhookSettings from './HealthWebhookSettings';
import PrivacySettings from './PrivacySettings';
import GoalSettings from './GoalSettings';
import { useDisplayPrefs } from '@/hooks/useDisplayPrefs';
const Settings: React.FC = () => {
    const { t, language } = useLanguage();
    const { hideNumbers, update: updateDisplayPrefs } = useDisplayPrefs();
    const es = language === 'es';
    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [busy, setBusy] = useState<'profile' | 'avatar' | 'password' | null>(null);
    const [profileMsg, setProfileMsg] = useState<Status>(null);
    const [passwordMsg, setPasswordMsg] = useState<Status>(null);
    const sections = [
        { id: 'settings-profile', label: t.profileSection },
        { id: 'settings-goal', label: es ? 'Objetivo' : 'Goal' },
        { id: 'settings-display', label: es ? 'Visualización' : 'Display' },
        { id: 'settings-wearable', label: es ? 'Reloj' : 'Watch' },
        { id: 'settings-security', label: t.securitySection },
        { id: 'settings-privacy', label: es ? 'Privacidad' : 'Privacy' },
    ];
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [signedIn, setSignedIn] = useState<boolean | null>(null);
    const [activeId, setActiveId] = useState(sections[0].id);
    const savedName = useRef('');
    const friendlyError = (err: any, fallback: string) => {
        const m = String(err?.message ?? '');
        if (/weak|at least|too short|characters/i.test(m)) return es ? 'La contraseña es demasiado corta o débil. Usa al menos 6 caracteres.' : 'That password is too short or weak. Use at least 6 characters.';
        if (/same password|different from the old/i.test(m)) return es ? 'La nueva contraseña debe ser distinta de la actual.' : 'The new password must differ from the current one.';
        if (/jwt|session|not authenticated|user not found|expired/i.test(m)) return es ? 'Tu sesión expiró. Vuelve a iniciar sesión.' : 'Your session expired. Sign in again.';
        if (/rate|too many/i.test(m)) return es ? 'Demasiados intentos. Espera un momento.' : 'Too many attempts. Wait a moment.';
        if (/fetch|network/i.test(m)) return es ? 'Sin conexión. Revisa tu internet e inténtalo otra vez.' : 'No connection. Check your internet and try again.';
        return fallback;
    };
    const dirty = signedIn === true && (fullName !== savedName.current || newPassword !== '' || confirmPassword !== '');
    useEffect(() => {
        if (!dirty) return;
        const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);
    const navRef = useRef<HTMLElement>(null);
    useEffect(() => {
        // Scroll only the chip row; scrollIntoView would also move the page and cancel the section jump.
        const nav = navRef.current;
        const chip = nav?.querySelector<HTMLElement>(`[data-sec="${activeId}"]`);
        if (nav && chip && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: chip.offsetLeft - (nav.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' });
    }, [activeId]);
    useEffect(() => {
        const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
        const io = new IntersectionObserver(
            (entries) => entries.forEach((en) => en.isIntersecting && setActiveId(en.target.id)),
            { rootMargin: '-15% 0px -70% 0px' },
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setSignedIn(!!user);
            if (user) {
                savedName.current = user.user_metadata.full_name || '';
                setFullName(user.user_metadata.full_name || '');
                setAvatarUrl(user.user_metadata.avatar_url || null);
            }
        };
        getUserData();
    }, []);
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
            setProfileMsg({ type: 'error', text: es ? 'Elige una imagen de menos de 5 MB.' : 'Choose an image under 5 MB.' });
            return;
        }
        setBusy('avatar');
        setProfileMsg(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);
            const { error: updateError } = await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });
            if (updateError) throw updateError;
            setAvatarUrl(publicUrl);
            setProfileMsg({ type: 'success', text: es ? 'Foto de perfil actualizada.' : 'Profile picture updated.' });
        } catch (err: any) {
            setProfileMsg({ type: 'error', text: friendlyError(err, es ? 'No se pudo subir la foto. Inténtalo de nuevo.' : 'Could not upload the photo. Try again.') });
        } finally {
            setBusy(null);
        }
    };
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setBusy('profile');
        setProfileMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });
            if (error) throw error;
            savedName.current = fullName;
            setProfileMsg({ type: 'success', text: es ? 'Perfil guardado.' : 'Profile saved.' });
        } catch (err: any) {
            setProfileMsg({ type: 'error', text: friendlyError(err, es ? 'No se pudo guardar el perfil. Inténtalo de nuevo.' : 'Could not save your profile. Try again.') });
        } finally {
            setBusy(null);
        }
    };
    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: 'error', text: t.passwordsDoNotMatch });
            return;
        }
        setBusy('password');
        setPasswordMsg(null);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            setPasswordMsg({ type: 'success', text: es ? 'Contraseña actualizada.' : 'Password updated.' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordMsg({ type: 'error', text: friendlyError(err, es ? 'No se pudo cambiar la contraseña. Inténtalo de nuevo.' : 'Could not change your password. Try again.') });
        } finally {
            setBusy(null);
        }
    };
    return (
        <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-32">
                <h1 className="sr-only">{t.settingsTitle}</h1>
                <div className="lg:grid lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-10 lg:items-start">
                <nav ref={navRef} aria-label={es ? 'Secciones' : 'Sections'} className="sticky top-0 z-10 -mx-4 px-4 py-2 mb-4 bg-background lg:static lg:mx-0 lg:px-0 lg:py-0 lg:mb-0 lg:bg-transparent lg:sticky lg:top-6 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible scrollbar-hide [mask-image:linear-gradient(to_right,black_88%,transparent)] lg:[mask-image:none]">
                    {sections.map((sec) => (
                        <button
                            key={sec.id}
                            data-sec={sec.id}
                            type="button"
                            onClick={() => document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                            aria-current={activeId === sec.id ? 'true' : undefined}
                            className={`shrink-0 min-h-10 px-4 rounded-full lg:rounded-xl lg:text-left text-sm font-medium border transition-colors hover:text-foreground hover:bg-secondary ${activeId === sec.id ? 'text-foreground bg-secondary border-border' : 'text-muted-foreground border-border lg:border-transparent'}`}
                        >
                            {sec.label}
                        </button>
                    ))}
                </nav>
                <div className="flex flex-col gap-8 min-w-0">
                {signedIn === false && (
                    <p role="status" className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
                        {es ? 'Inicia sesión para guardar tu perfil, cambiar la contraseña o conectar tu reloj. ' : 'Sign in to save your profile, change your password or connect your watch. '}
                        <Link href="/login" className="font-bold text-primary underline underline-offset-4">{es ? 'Iniciar sesión' : 'Sign in'}</Link>
                    </p>
                )}
                {/* Profile Section */}
                <SettingsSection id="settings-profile" title={t.profileSection} icon="person">
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                      <fieldset disabled={signedIn === false} className="contents">
                        <FormField label={t.fullNameLabel} htmlFor="settings-fullname">
                            <input
                                id="settings-fullname"
                                autoComplete="name"
                                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </FormField>
                        <FormField label={t.changePhotoLabel} optional optionalLabel={t.optionalStatement} htmlFor="settings-avatar">
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    id="settings-avatar"
                                    onClick={handleAvatarClick}
                                    aria-label={t.changePhotoLabel}
                                    disabled={busy === 'avatar'}
                                    className="size-20 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-dashed border-primary/20 hover:bg-primary/20 transition-all cursor-pointer overflow-hidden disabled:opacity-50"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined">add_a_photo</span>
                                    )}
                                </button>
                                <p className="text-sm text-muted-foreground max-w-[220px]">
                                    {es ? 'Toca el círculo para subir una foto nueva (máx. 5 MB).' : 'Tap the circle to upload a new photo (max 5 MB).'}
                                </p>
                            </div>
                        </FormField>
                        <button
                            type="submit"
                            disabled={busy !== null}
                            className="w-fit px-8 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {busy === 'profile' ? (es ? 'Guardando…' : 'Saving…') : t.saveChanges}
                        </button>
                        <StatusText status={profileMsg} />
                        {signedIn === false && <p className="text-sm text-muted-foreground -mt-3">{es ? 'Inicia sesión para guardar.' : 'Sign in to save.'}</p>}
                      </fieldset>
                    </form>
                </SettingsSection>
                <SettingsSection id="settings-goal" title={es ? 'Mi objetivo y perfil' : 'My goal and profile'} icon="flag">
                    <GoalSettings language={language} />
                </SettingsSection>
                {/* Display: hide calories, macros, weight and waist */}
                <SettingsSection id="settings-display" title={es ? 'Cómo ver tus datos' : 'How you see your data'} icon="visibility_off">
                    <label className="flex items-start gap-4 cursor-pointer">
                        <span className="relative mt-0.5 shrink-0">
                        <input
                            type="checkbox"
                            role="switch"
                            className="peer sr-only"
                            checked={hideNumbers}
                            onChange={(e) => void updateDisplayPrefs({ hideNumbers: e.target.checked })}
                        />
                        <span aria-hidden="true" className="block w-11 h-6 rounded-full bg-secondary border transition-colors border-foreground/40 peer-checked:bg-primary peer-checked:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 ring-offset-background after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-foreground/80 peer-checked:after:bg-primary-foreground after:transition-transform peer-checked:after:translate-x-5" />
                        </span>
                        <span className="flex flex-col gap-1">
                            <span className="text-foreground font-semibold">{es ? 'Modo sin números' : 'No-numbers mode'}</span>
                            <span className="text-sm text-muted-foreground">
                                {es
                                    ? 'Oculta calorías, macros, peso y cintura en la app y en el informe. También le pide al asistente que no hable de peso ni de calorías.'
                                    : 'Hides calories, macros, weight and waist in the app and in the report. It also asks the assistant not to talk about weight or calories.'}
                            </span>
                        </span>
                    </label>
                </SettingsSection>
                {/* Wearable: Health Connect (recommended for Samsung / Galaxy Watch) */}
                {signedIn === false ? (
                    <p id="settings-wearable" className="flex items-center gap-2 px-2 text-sm text-muted-foreground scroll-mt-20 lg:scroll-mt-6">
                        <span className="material-symbols-outlined" aria-hidden="true">sync_alt</span>
                        {es ? 'Samsung y Health Connect: disponible al iniciar sesión.' : 'Samsung and Health Connect: available once you sign in.'}
                    </p>
                ) : (
                <SettingsSection quiet id="settings-wearable" title={t.healthWebhookSection} icon="sync_alt">
                    <HealthWebhookSettings />
                </SettingsSection>
                )}
                {/* Security Section */}
                <SettingsSection quiet id="settings-security" title={t.securitySection} icon="shield">
                    <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
                      <fieldset disabled={signedIn === false} className="contents">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t.newPasswordLabel} htmlFor="settings-newpw" >
                                <input
                                    id="settings-newpw"
                                    autoComplete="new-password"
                                    minLength={6}
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </FormField>
                            <FormField label={t.confirmNewPasswordLabel} htmlFor="settings-confirmpw">
                                <input
                                    id="settings-confirmpw"
                                    autoComplete="new-password"
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </FormField>
                        </div>
                        <p className="text-sm text-muted-foreground -mt-3">{es ? 'Mínimo 6 caracteres.' : 'At least 6 characters.'}</p>
                        <button
                            type="submit"
                            disabled={busy !== null}
                            className="w-fit px-8 h-12 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                        >
                            {busy === 'password' ? (es ? 'Actualizando…' : 'Updating…') : t.updatePasswordButton}
                        </button>
                        <StatusText status={passwordMsg} />
                        {signedIn === false && <p className="text-sm text-muted-foreground -mt-3">{es ? 'Inicia sesión para cambiar la contraseña.' : 'Sign in to change your password.'}</p>}
                      </fieldset>
                    </form>
                </SettingsSection>
                <div id="settings-privacy" className="scroll-mt-20 lg:scroll-mt-6"><PrivacySettings /></div>
                </div>
                </div>
            </div>
        </div>
    );
};
export default Settings;
