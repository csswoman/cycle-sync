'use client';
import React, { useEffect, useState } from 'react';
import { useMedications } from '@/hooks/useMedications';
import { requestMedicationNotifications } from '@/hooks/useMedicationReminders';

const PRESETS = ['Metformin', 'Inositol', 'Birth control', 'Vitamin D'];

export interface MedicationSummary { taken: number; total: number }

interface MedicationsProps {
  /** Render without the page wrapper and title (used inside the daily log). */
  embedded?: boolean;
  onSummary?: (summary: MedicationSummary) => void;
}

const Medications: React.FC<MedicationsProps> = ({ embedded = false, onSummary }) => {
  const { medications, loading, addMedication, removeMedication, isTaken, setTaken } = useMedications();
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [reminders, setReminders] = useState(true);
  const [perm, setPerm] = useState<string>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );

  const handleAdd = async () => {
    if (!name.trim() || times.length === 0 || times.some((t) => !t)) return;
    if (reminders) setPerm(await requestMedicationNotifications());
    await addMedication(name.trim(), dose.trim(), times, reminders);
    setName(''); setDose(''); setTimes(['08:00']);
  };

  useEffect(() => {
    if (!onSummary) return;
    const total = medications.reduce((n, m) => n + m.times.length, 0);
    const taken = medications.reduce((n, m) => n + m.times.filter((t) => isTaken(m.id, t)).length, 0);
    onSummary({ taken, total });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medications, isTaken]);

  const content = (
    <>
        {!embedded && (
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-3xl md:text-4xl font-semibold leading-tight tracking-tight">Medications</h1>
            <p className="text-muted-foreground text-base">Track your daily doses and get reminders.</p>
          </div>
        )}

        {perm === 'denied' && (
          <p className="text-sm text-amber-500">Notifications are blocked in your browser settings, so reminders will not appear.</p>
        )}
        {perm === 'default' && medications.some((m) => m.reminders) && (
          <button
            onClick={async () => setPerm(await requestMedicationNotifications())}
            className="self-start text-sm font-bold text-primary underline"
          >
            Enable notifications
          </button>
        )}

        <div className="flex flex-col gap-3">
          {loading && <p className="text-muted-foreground text-sm">Loading…</p>}
          {!loading && medications.length === 0 && (
            <p className="text-muted-foreground text-sm">No medications yet. Add one below.</p>
          )}
          {medications.map((med) => (
            <div key={med.id} className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-foreground font-bold">{med.name}</h3>
                  {med.dose && <p className="text-muted-foreground text-sm">{med.dose}</p>}
                </div>
                <button
                  onClick={() => removeMedication(med.id)}
                  aria-label={`Remove ${med.name}`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {med.times.map((time) => {
                  const taken = isTaken(med.id, time);
                  return (
                    <button
                      key={time}
                      onClick={() => setTaken(med.id, time, !taken)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                        taken
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-foreground border-border'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {taken ? 'check_circle' : 'radio_button_unchecked'}
                      </span>
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-4">
          <h2 className="text-foreground font-bold">Add medication</h2>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} onClick={() => setName(p)} className="px-3 py-1 rounded-full text-xs font-bold bg-secondary text-foreground border border-border">
                {p}
              </button>
            ))}
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name"
            className="bg-secondary text-foreground rounded-xl px-4 py-2.5 text-sm border border-border" />
          <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dose (e.g. 500 mg)"
            className="bg-secondary text-foreground rounded-xl px-4 py-2.5 text-sm border border-border" />
          <div className="flex flex-col gap-2">
            <span className="text-muted-foreground text-xs font-bold">Schedule</span>
            {times.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="time" value={t}
                  onChange={(e) => setTimes(times.map((x, j) => (j === i ? e.target.value : x)))}
                  className="bg-secondary text-foreground rounded-xl px-4 py-2 text-sm border border-border" />
                {times.length > 1 && (
                  <button onClick={() => setTimes(times.filter((_, j) => j !== i))} aria-label="Remove time" className="text-muted-foreground">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                )}
              </div>
            ))}
            <button onClick={() => setTimes([...times, '20:00'])} className="self-start text-sm font-bold text-primary">
              + Add time
            </button>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} />
            Remind me with a notification
          </label>
          <button onClick={handleAdd}
            className="self-start bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm">
            Save
          </button>
        </div>
    </>
  );
  if (embedded) return <div className="flex flex-col gap-8">{content}</div>;
  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-8 pb-32">
        {content}
      </div>
    </div>
  );
};

export default Medications;
