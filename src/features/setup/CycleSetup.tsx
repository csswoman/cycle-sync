import React, { useEffect, useMemo, useState } from 'react';
import { View } from '@/types';
import { StepCycleDetails } from './components/StepCycleDetails';
import { StepPreferences } from './components/StepPreferences';
import { StepProfileFinalize } from './components/StepProfileFinalize';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';
import { onboardingText } from '@/i18n/onboardingText';
import {
    addDays, cycleLengthsFromStarts, estimateCycle, groupDaysIntoPeriods, parseLocalDate, toISODate,
} from '@/lib/cycle/cycleEngine';

interface CycleSetupProps {
    onNavigate: (view: View) => void;
}

const CycleSetup: React.FC<CycleSetupProps> = ({ onNavigate }) => {
    const { language } = useLanguage();
    const text = onboardingText[language].setup;
    const [step, setStep] = useState(2);
    const [cycleLength, setCycleLength] = useState(28);
    const [selectedTraining, setSelectedTraining] = useState<string[]>([]);
    const [selectedFood, setSelectedFood] = useState<string[]>([]);
    const [userName, setUserName] = useState('');
    const [profilePic, setProfilePic] = useState('https://lh3.googleusercontent.com/aida-public/AB6AXuDsvySV6JHheB_2QTPrBxRW-WlPhII5ihPXtZ2SqR5vH__HjdCIoXlg4RBVuiMjUJha1iy3-K9NkNDQ1CxG4KKvsX_FZREjkfrapXJnVo0SBCzf4It_WPpVEv-VVa2yUaJW8wdnBPZZ7jOLxqycpnqA1FnmDOtVQL5m425jGmxqs5fXaeIJsf3h0JJRa5X2PZ05aJc5wKTudNG6YUveRY7twSunxCalqn3X2-wpQvlaVz2DeQ5SqfMo8x-MrPI_JLz7jro6j8aJaCQ');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [savedPeriods, setSavedPeriods] = useState<{ start_date: string; end_date: string | null }[]>([]);
    const [unsure, setUnsure] = useState(false);

    // Pre-fill from what is already saved (the setup can be re-run to edit).
    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;
            if (!user) return;
            const [periodsRes, configRes] = await Promise.all([
                supabase.from('periods').select('start_date,end_date').eq('user_id', user.id),
                supabase.from('cycle_config').select('cycle_length,workout_prefs,dietary_prefs').eq('user_id', user.id).maybeSingle(),
            ]);
            setSavedPeriods(periodsRes.data ?? []);
            if (configRes.data) {
                setCycleLength(configRes.data.cycle_length ?? 28);
                setSelectedTraining(configRes.data.workout_prefs ?? []);
                setSelectedFood(configRes.data.dietary_prefs ?? []);
            }
            if (user.user_metadata?.full_name) setUserName(user.user_metadata.full_name);
            if (user.user_metadata?.avatar_url) setProfilePic(user.user_metadata.avatar_url);
        })();
    }, []);

    const savedDays = useMemo(() => {
        const days: string[] = [];
        for (const p of savedPeriods) {
            const start = parseLocalDate(p.start_date);
            const end = p.end_date ? parseLocalDate(p.end_date) : start;
            for (let d = start; d <= end; d = addDays(d, 1)) days.push(toISODate(d));
        }
        return days;
    }, [savedPeriods]);

    // Every period start, saved or newly marked, feeds the cycle length estimate.
    const allPeriods = useMemo(() => {
        const runs = groupDaysIntoPeriods([...savedDays, ...selectedDays]);
        return runs.map((r) => ({ start_date: r.start, end_date: r.end }));
    }, [savedDays, selectedDays]);
    const detectedCycles = useMemo(() => cycleLengthsFromStarts(allPeriods.map((p) => p.start_date)).length, [allPeriods]);

    const handleChangeDays = (days: string[]) => {
        setSelectedDays(days);
        const merged = groupDaysIntoPeriods([...savedDays, ...days]).map((r) => r.start);
        if (cycleLengthsFromStarts(merged).length > 0) {
            setCycleLength(estimateCycle(merged.map((s) => ({ start_date: s })), null).cycleLength);
        }
    };

    const hasCycleData = selectedDays.length + savedDays.length > 0 || unsure;
    const canAdvance = step !== 2 || hasCycleData;

    const handleNext = async () => {
        if (!canAdvance) return;
        if (step < 4) { setStep(step + 1); return; }
        setSaving(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setError(text.needLogin); return; }

            const existingStarts = new Set(savedPeriods.map((p) => p.start_date.slice(0, 10)));
            const rows = groupDaysIntoPeriods(selectedDays)
                .filter((r) => !existingStarts.has(r.start))
                .map((r) => ({ user_id: user.id, start_date: r.start, end_date: r.end === r.start ? null : r.end }));
            if (rows.length) {
                const { error: periodsError } = await supabase.from('periods').insert(rows);
                if (periodsError) throw periodsError;
            }
            const allStarts = [...existingStarts, ...rows.map((r) => r.start_date)].sort();
            const config: Record<string, unknown> = {
                user_id: user.id,
                cycle_length: cycleLength,
                workout_prefs: selectedTraining,
                dietary_prefs: selectedFood,
                updated_at: new Date().toISOString(),
            };
            if (allStarts.length) config.last_period_start = allStarts[allStarts.length - 1];
            const { error: configError } = await supabase.from('cycle_config').upsert(config, { onConflict: 'user_id' });
            if (configError) throw configError;

            if (userName.trim()) {
                await supabase.auth.updateUser({ data: { full_name: userName.trim() } });
            }
            onNavigate(View.DASHBOARD);
        } catch (err) {
            console.error('Error saving setup:', err);
            setError(text.saveError);
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        if (step > 2) setStep(step - 1);
        else onNavigate(View.ARCHETYPE_SELECTION);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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

            await supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            setProfilePic(publicUrl);
        } catch (err) {
            console.error('Error uploading image:', err);
            // Fallback to local preview if upload fails
            const reader = new FileReader();
            reader.onloadend = () => setProfilePic(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const toggleSelection = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const progressPercentage = step === 2 ? 50 : step === 3 ? 75 : 100;
    const stepName = step === 2 ? text.stepNames.cycle : step === 3 ? text.stepNames.preferences : text.stepNames.profile;
    const why = text.why[step - 2];

    return (
        <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
            <div className="flex justify-center py-8 px-4 sm:px-6 lg:px-8 pb-32">
                <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                            <div className="flex gap-6 justify-between items-end">
                                <p className="text-base font-medium text-foreground">{text.stepOf(step, 4, stepName)}</p>
                                <span className="text-primary text-sm font-bold">{text.percentComplete(progressPercentage)}</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercentage}%` }}></div>
                            </div>
                        </div>


                        {step === 2 && (
                            <StepCycleDetails
                                selectedDays={selectedDays}
                                onChangeDays={handleChangeDays}
                                savedDays={savedDays}
                                cycleLength={cycleLength}
                                setCycleLength={setCycleLength}
                                detectedCycles={detectedCycles}
                                unsure={unsure}
                                setUnsure={setUnsure}
                            />
                        )}
                        {step === 3 && (
                            <StepPreferences
                                selectedTraining={selectedTraining}
                                selectedFood={selectedFood}
                                onToggleTraining={(id) => toggleSelection(id, selectedTraining, setSelectedTraining)}
                                onToggleFood={(id) => toggleSelection(id, selectedFood, setSelectedFood)}
                            />
                        )}
                        {step === 4 && (
                            <StepProfileFinalize
                                userName={userName}
                                setUserName={setUserName}
                                profilePic={profilePic}
                                onImageUpload={handleImageUpload}
                            />
                        )}

                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <div className="flex items-center justify-between pt-4 mt-auto">
                            <button onClick={handleBack} className="px-6 py-3 rounded-lg text-sm font-bold text-muted-foreground hover:bg-secondary transition-colors">
                                {text.back}
                            </button>
                            <button onClick={handleNext} disabled={saving || !canAdvance} className="px-8 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50">
                                <span>{saving ? text.saving : step === 4 ? text.complete : text.next}</span>
                                {!saving && (step < 4 ? <span className="material-symbols-outlined text-sm">arrow_forward</span> : <span className="material-symbols-outlined text-sm">check</span>)}
                            </button>
                        </div>

                    </div>

                    <div className="w-full lg:w-[360px] flex flex-col gap-6">
                        <div className="bg-card rounded-xl p-6 border border-primary/20 flex flex-col gap-4 relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all"></div>
                            <div className="flex items-center gap-3 text-primary mb-2">
                                <span className="material-symbols-outlined">
                                    {step === 2 ? 'fitness_center' : step === 3 ? 'restaurant' : 'person'}
                                </span>
                                <h4 className="font-bold text-sm tracking-wide uppercase">{text.whyWeAsk}</h4>
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-3 text-foreground">{why.title}</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{why.body}</p>
                            </div>
                            {step === 2 && <div className="mt-4 h-32 rounded-lg bg-cover bg-center" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuABHxzOqeeHp7_mZjabuo_gSUbETeuK_tRZ8K14baatJJwfInnd_1XmeR21PZ4WdXD60rCt7QEnPREKBMcB1Ddjxd-R7oNLSuDuUUOC779atbboBoTcF99lDyy6-SrKm_HRUVmbiOb49kqpiklkpAUaWnOi_TfKuCCJ_sGVsaiy24mBJBaH8iVrcI0OD5A0JkVYrLOmN9L5wElpQfBYt_oab77YgMOhgrNCqTMYgKx7UuNG8X15xkOwR-VcALi5KNV6cUppxGsfVEo")' }}></div>}
                        </div>


                        <div className="bg-card rounded-xl p-5 border border-border flex items-center gap-4">
                            <div className="size-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <div>
                                <h5 className="text-sm font-bold text-foreground">{text.privacyTitle}</h5>
                                <p className="text-xs text-muted-foreground mt-0.5">{text.privacyBody}</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default CycleSetup;
