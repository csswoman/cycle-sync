import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/i18n/LanguageContext';

interface Period {
    id: string;
    start_date: string;
    end_date: string | null;
}

const PeriodHistory: React.FC = () => {
    const { t } = useLanguage();
    const [periods, setPeriods] = useState<Period[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [regularity, setRegularity] = useState<string>('notEnoughData');
    const [avgCycleLength, setAvgCycleLength] = useState<number | null>(null);

    useEffect(() => {
        fetchPeriods();
    }, []);

    const fetchPeriods = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from('periods')
            .select('*')
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching periods:', error);
        } else if (data) {
            setPeriods(data);
            calculateRegularity(data);
        }
    };

    const calculateRegularity = (data: Period[]) => {
        if (data.length < 3) {
            setRegularity('notEnoughData');
            return;
        }

        // Calculate cycle lengths (days between consecutive start dates)
        const cycleLengths: number[] = [];
        for (let i = 0; i < data.length - 1; i++) {
            const current = new Date(data[i].start_date);
            const previous = new Date(data[i + 1].start_date);
            const diffTime = Math.abs(current.getTime() - previous.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            cycleLengths.push(diffDays);
        }

        const avg = cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length;
        setAvgCycleLength(Math.round(avg));

        const max = Math.max(...cycleLengths);
        const min = Math.min(...cycleLengths);

        // If variation is > 8 days, it's considered irregular
        if (max - min > 8) {
            setRegularity('irregular');
        } else {
            setRegularity('regular');
        }
    };

    const handleAddPeriod = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            const { error } = await supabase
                .from('periods')
                .insert([{
                    user_id: user.id,
                    start_date: startDate,
                    end_date: endDate || null
                }]);

            if (error) throw error;

            setStartDate('');
            setEndDate('');
            fetchPeriods();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const deletePeriod = async (id: string) => {
        const { error } = await supabase
            .from('periods')
            .delete()
            .eq('id', id);

        if (error) {
            alert(error.message);
        } else {
            fetchPeriods();
        }
    };

    return (
        <div className="flex-1 overflow-y-auto h-full bg-background p-6 md:p-10">
            <div className="max-w-[800px] mx-auto flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-foreground text-4xl font-black tracking-tight">{t.cycleHistoryTitle}</h1>
                    <p className="text-muted-foreground">{t.markDaysDescription}</p>
                </div>

                {/* Regularity Status Card */}
                <div className="bg-secondary/40 border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                    <div className={`size-16 rounded-full flex items-center justify-center shrink-0 ${
                        regularity === 'regular' ? 'bg-green-500/20 text-green-500' : 
                        regularity === 'irregular' ? 'bg-amber-500/20 text-amber-500' : 
                        'bg-primary/20 text-primary'
                    }`}>
                        <span className="material-symbols-outlined text-4xl">
                            {regularity === 'regular' ? 'check_circle' : regularity === 'irregular' ? 'warning' : 'info'}
                        </span>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="text-foreground font-bold text-xl">{t.regularityStatus}</h3>
                        <p className="text-muted-foreground">
                            {regularity === 'regular' ? t.regular : regularity === 'irregular' ? t.irregular : t.notEnoughData}
                            {avgCycleLength && ` • Average Cycle: ${avgCycleLength} days`}
                        </p>
                    </div>
                </div>

                {/* Add Period Form */}
                <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-foreground font-bold text-lg mb-4">{t.addPeriod}</h3>
                    <form onSubmit={handleAddPeriod} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">{t.periodStartDate}</label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-secondary border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase">{t.periodEndDate} ({t.optionalStatement})</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-secondary border border-border rounded-xl py-2 px-4 text-foreground focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-primary-foreground font-bold h-11 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                {t.addPeriod}
                            </button>
                        </div>
                    </form>
                </div>

                {/* History List */}
                <div className="flex flex-col gap-4">
                    <h3 className="text-foreground font-bold text-lg px-2">{t.periodHistory}</h3>
                    <div className="flex flex-col gap-3">
                        {periods.length === 0 ? (
                            <div className="p-8 text-center bg-secondary/20 border border-dashed border-border rounded-2xl">
                                <p className="text-muted-foreground">No periods logged yet.</p>
                            </div>
                        ) : (
                            periods.map((period) => {
                                const start = new Date(period.start_date).toLocaleDateString();
                                const end = period.end_date ? new Date(period.end_date).toLocaleDateString() : 'Active';
                                const duration = period.end_date ? 
                                    Math.ceil((new Date(period.end_date).getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1 
                                    : null;

                                return (
                                    <div key={period.id} className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between group hover:border-primary/30 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                <span className="material-symbols-outlined">calendar_today</span>
                                            </div>
                                            <div>
                                                <p className="text-foreground font-bold">{start} - {end}</p>
                                                {duration && <p className="text-xs text-muted-foreground">{duration} days duration</p>}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => deletePeriod(period.id)}
                                            className="text-muted-foreground hover:text-destructive p-2 rounded-lg bg-secondary/50 hover:bg-destructive/10 transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PeriodHistory;
