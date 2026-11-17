import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';
import { SettingsSection, FormField } from './components/SettingsComponents';
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
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        const getUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
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

        setLoading(true);
        setMessage(null);

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
            setMessage({ type: 'success', text: es ? '¡Foto de perfil actualizada!' : 'Profile picture updated!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });
            if (error) throw error;
            setMessage({ type: 'success', text: t.saveChanges });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: t.passwordsDoNotMatch });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });
            if (error) throw error;
            setMessage({ type: 'success', text: es ? '¡Contraseña actualizada con éxito!' : 'Password updated successfully!' });
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto h-full scrollbar-hide">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">
                <h1 className="text-foreground text-3xl md:text-4xl font-semibold tracking-tight">{t.settingsTitle}</h1>

                {message && (
                    <div className={`p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                        {message.text}
                    </div>
                )}

                {/* Profile Section */}
                <SettingsSection title={t.profileSection} icon="person">
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6">
                        <FormField label={t.fullNameLabel}>
                            <input
                                className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </FormField>

                        <FormField label={t.changePhotoLabel} optional optionalLabel={t.optionalStatement}>
                            <div className="flex items-center gap-4">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <div
                                    onClick={handleAvatarClick}
                                    className="size-20 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-dashed border-primary/20 hover:bg-primary/20 transition-all cursor-pointer overflow-hidden"
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="material-symbols-outlined">add_a_photo</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground max-w-[200px]">
                                    {es ? 'Haz clic aquí para subir una nueva foto de perfil.' : 'Click here or drag and drop to upload a new profile picture.'}
                                </p>
                            </div>
                        </FormField>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit px-8 h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : t.saveChanges}
                        </button>
                    </form>
                </SettingsSection>

                <SettingsSection title={es ? 'Mi objetivo' : 'My goal'} icon="flag">
                    <GoalSettings language={language} />
                </SettingsSection>
                {/* Display: hide calories, macros, weight and waist */}
                <SettingsSection title={es ? 'Cómo ver tus datos' : 'How you see your data'} icon="visibility_off">
                    <label className="flex items-start gap-4 cursor-pointer">
                        <input
                            type="checkbox"
                            role="switch"
                            className="size-5 mt-0.5 accent-primary"
                            checked={hideNumbers}
                            onChange={(e) => void updateDisplayPrefs({ hideNumbers: e.target.checked })}
                        />
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
                <SettingsSection title={t.healthWebhookSection} icon="sync_alt">
                    <p className="text-sm text-muted-foreground mb-4">{t.wearableHealthConnectHint}</p>
                    <HealthWebhookSettings />
                </SettingsSection>


                {/* Security Section */}
                <SettingsSection title={t.securitySection} icon="shield">
                    <form onSubmit={handleUpdatePassword} className="flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField label={t.newPasswordLabel}>
                                <input
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </FormField>
                            <FormField label={t.confirmNewPasswordLabel}>
                                <input
                                    type="password"
                                    className="w-full bg-secondary border border-border rounded-xl py-2.5 px-4 text-foreground focus:outline-none focus:border-primary transition-all"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </FormField>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-fit px-8 h-12 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all disabled:opacity-50"
                        >
                            {loading ? '...' : t.updatePasswordButton}
                        </button>
                    </form>
                </SettingsSection>
                <PrivacySettings />
            </div>
        </div>
    );
};

export default Settings;
