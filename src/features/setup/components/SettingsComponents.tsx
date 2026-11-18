import React from 'react';

interface SettingsSectionProps {
    title: string;
    icon: string;
    id?: string;
    quiet?: boolean;
    children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({ title, icon, id, quiet, children }) => {
    return (
        <section id={id} className={`border border-border rounded-2xl p-6 md:p-8 scroll-mt-20 lg:scroll-mt-6 ${quiet ? 'bg-transparent' : 'bg-card shadow-sm'}`}>
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2 [word-spacing:0.08em]">
                <span className="material-symbols-outlined" aria-hidden="true">{icon}</span>
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
    hint?: string;
    htmlFor?: string;
    children: React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({ label, optional, optionalLabel, hint, htmlFor, children }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={htmlFor} className="text-sm font-bold text-foreground/80 flex items-center gap-2">
                {label}
                {optional && (
                    <span className="bg-secondary text-xs px-2 py-0.5 rounded-full text-muted-foreground font-semibold">
                        {optionalLabel || 'Optional'}
                    </span>
                )}
            </label>
            {children}
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
    );
};

export type Status = { type: 'success' | 'error'; text: string } | null;

export const StatusText: React.FC<{ status: Status }> = ({ status }) =>
    status ? (
        <p
            role={status.type === 'error' ? 'alert' : 'status'}
            className={`text-sm font-medium ${status.type === 'success' ? 'text-leaf' : 'text-destructive'}`}
        >
            {status.text}
        </p>
    ) : null;
