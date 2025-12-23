import React from 'react';

interface SettingsSectionProps {
    title: string;
    icon: string;
    children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, children }) => {
    return (
        <section className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">{icon}</span>
                {title}
            </h2>
            {children}
        </section>
    );
};

interface FormFieldProps {
    label: string;
    optional?: boolean;
    optionalLabel?: string;
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, optional, optionalLabel, children }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                {label}
                {optional && (
                    <span className="bg-secondary text-[10px] px-2 py-0.5 rounded-full text-muted-foreground uppercase font-black tracking-widest">
                        {optionalLabel || 'Optional'}
                    </span>
                )}
            </label>
            {children}
        </div>
    );
};
