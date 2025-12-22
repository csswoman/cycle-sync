import React from 'react';

const Trends: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide">
      <div className="max-w-[1400px] mx-auto p-6 md:p-10 flex flex-col gap-8 pb-20">

        {/* Page Heading & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-foreground text-3xl md:text-4xl font-black leading-tight tracking-tight">My Patterns</h1>
            <p className="text-muted-foreground text-base font-normal">Analyzing 4 Cycles of Data</p>
          </div>
          {/* Chips Filter */}
          <div className="flex gap-2 flex-wrap">
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full border border-border bg-card px-4 hover:border-primary transition-colors">
              <span className="text-foreground text-sm font-medium">Last 30 Days</span>
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-primary px-4 text-primary-foreground shadow-lg shadow-primary/20">
              <span className="text-sm font-medium">Current Cycle</span>
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full border border-border bg-card px-4 hover:border-primary transition-colors">
              <span className="text-foreground text-sm font-medium">Last 3 Cycles</span>
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full border border-border bg-card px-4 hover:border-primary transition-colors">
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span className="text-foreground text-sm font-medium">Custom</span>
            </button>

          </div>
        </div>

        {/* Stats Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stat Card 1 */}
          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">water_drop</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Current Phase</p>
              <div className="flex items-baseline gap-2">
                <p className="text-foreground text-2xl font-bold">Luteal</p>
                <span className="text-primary font-semibold text-lg">Day 22</span>
              </div>
            </div>
            <div className="mt-4 w-full bg-secondary rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Stat Card 2 */}
          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">battery_charging_full</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Readiness Score</p>
              <p className="text-foreground text-2xl font-bold">Low Intensity</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center rounded-md bg-yellow-400/10 px-2 py-1 text-xs font-medium text-yellow-500 ring-1 ring-inset ring-yellow-400/20">Recovery Focus</span>
            </div>
          </div>
          {/* Stat Card 3 */}
          <div className="flex flex-col justify-between rounded-xl p-6 bg-card border border-border shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary">
              <span className="material-symbols-outlined text-6xl">medical_services</span>
            </div>
            <div className="flex flex-col gap-1 relative z-10">
              <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Top Symptom</p>
              <p className="text-foreground text-2xl font-bold">Bloating</p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">PCOS Marker</span>
            </div>
          </div>

        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart: Cycle vs Performance (Spans 2 columns) */}
          <div className="lg:col-span-2 rounded-xl p-6 bg-card border border-border shadow-sm flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-foreground text-lg font-bold">Cycle vs. Performance</h3>
                <p className="text-muted-foreground text-sm">Correlating energy levels with hormonal phases</p>
              </div>
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
            </div>

            {/* Chart Area Placeholder */}
            <div className="flex-1 w-full relative">
              {/* Axis Y */}
              <div className="absolute left-0 top-0 bottom-8 w-8 flex flex-col justify-between text-xs text-muted-foreground text-right pr-2">
                <span>High</span>
                <span>Med</span>
                <span>Low</span>
              </div>
              {/* Chart Visual */}
              <div className="absolute left-10 right-0 top-2 bottom-8 flex items-end justify-between gap-1">
                {/* Day 1-7 (Menstrual) */}
                <div className="h-full w-full flex items-end gap-1 group relative">
                  <div className="absolute -top-6 left-0 text-[10px] uppercase font-bold text-muted-foreground">Menstrual</div>
                  <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t h-[30%] transition-all relative"></div>
                  <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t h-[35%] transition-all relative"></div>
                  <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t h-[40%] transition-all relative"></div>
                  <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t h-[55%] transition-all relative"></div>
                  <div className="w-full bg-primary/20 hover:bg-primary/40 rounded-t h-[60%] transition-all relative"></div>
                </div>
                {/* Day 8-14 (Follicular/Ovulation) */}
                <div className="h-full w-full flex items-end gap-1 group relative">
                  <div className="absolute -top-6 left-0 text-[10px] uppercase font-bold text-primary">Follicular</div>
                  <div className="w-full bg-primary hover:bg-primary/80 rounded-t h-[70%] transition-all"></div>
                  <div className="w-full bg-primary hover:bg-primary/80 rounded-t h-[80%] transition-all"></div>
                  <div className="w-full bg-primary hover:bg-primary/80 rounded-t h-[85%] transition-all"></div>
                  <div className="w-full bg-primary hover:bg-primary/80 rounded-t h-[95%] transition-all"></div> {/* Peak Ovulation */}
                  <div className="w-full bg-primary hover:bg-primary/80 rounded-t h-[90%] transition-all"></div>
                </div>
                {/* Day 15-28 (Luteal) */}
                <div className="h-full w-full flex items-end gap-1 group relative">
                  <div className="absolute -top-6 left-0 text-[10px] uppercase font-bold text-muted-foreground">Luteal</div>
                  <div className="w-full bg-primary/40 hover:bg-primary/60 rounded-t h-[80%] transition-all"></div>
                  <div className="w-full bg-primary/40 hover:bg-primary/60 rounded-t h-[70%] transition-all"></div>
                  <div className="w-full bg-primary/40 hover:bg-primary/60 rounded-t h-[60%] transition-all"></div>
                  <div className="w-full bg-primary/40 hover:bg-primary/60 rounded-t h-[50%] transition-all"></div>
                  <div className="w-full bg-primary/40 hover:bg-primary/60 rounded-t h-[40%] transition-all"></div>
                  <div className="w-full bg-primary/40 hover:bg-primary/60 rounded-t h-[35%] transition-all"></div>
                  <div className="w-full bg-primary/40 hover:bg-primary/60 rounded-t h-[30%] transition-all"></div>
                </div>
              </div>
              {/* Axis X */}
              <div className="absolute left-10 right-0 bottom-0 h-6 flex justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Day 1</span>
                <span>Day 7</span>
                <span>Day 14</span>
                <span>Day 21</span>
                <span>Day 28</span>
              </div>
              {/* Simple Line Overlay for BBT (Basal Body Temp) */}
              <svg className="absolute left-10 right-0 top-2 bottom-8 w-[calc(100%-40px)] h-full overflow-visible pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 Q20,80 30,70 T50,30 T70,40 T100,60" fill="none" stroke="currentColor" strokeDasharray="4" strokeWidth="2" className="text-primary opacity-50"></path>
                <text fill="currentColor" fontSize="4" fontWeight="bold" x="90" y="55" className="text-primary opacity-50">BBT</text>
              </svg>
            </div>

          </div>

          {/* Right Column: Wearable & Insights */}
          <div className="flex flex-col gap-6">
            {/* Pattern Insight Card */}
            <div className="rounded-xl p-6 bg-primary text-primary-foreground shadow-lg flex flex-col justify-between min-h-[180px] relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-primary-foreground/10">
                <span className="material-symbols-outlined text-[120px]">lightbulb</span>
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="text-sm font-bold uppercase tracking-wide opacity-90 text-primary-foreground">Insight</span>
                </div>
                <h4 className="text-xl font-bold leading-snug mb-2">Strength Peak Incoming</h4>
                <p className="opacity-90 text-sm leading-relaxed text-primary-foreground">Based on your past 3 cycles, your strength metrics typically peak between <span className="font-bold">Day 10-14</span>.</p>
              </div>
              <button className="relative z-10 mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors text-center text-primary-foreground">
                View Strength Plan
              </button>
            </div>


            {/* Wearable Data Summary */}
            <div className="flex-1 rounded-xl p-6 bg-card border border-border shadow-sm flex flex-col">
              <h3 className="text-foreground text-lg font-bold mb-4">Biometrics</h3>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                      <span className="material-symbols-outlined">bedtime</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sleep Quality</p>
                      <p className="text-lg font-bold text-foreground">84% <span className="text-xs font-normal text-green-500">(+4%)</span></p>
                    </div>
                  </div>
                  <div className="h-10 w-16 bg-center bg-contain bg-no-repeat opacity-50" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDGyUX4hCFBAeK5MPjOVA8fCSlstY20gghSa9staKtBJj7mLOpAqL8DxolJXUsZKFC3eW-Ksz2P-8AE3C8Ql6XSX-5Kuu7xwKWsHwpc5qUqcdKHWHdZNIYWGJbUcz0AvXbAkzbUTbh7j1E41q1OYayFAgwQ0O0Th5kxycNi8KyxPXhHFjkaT-4PDhREDJTakeXe_R_pwYZ3LWy7i9b_SN84Xp5UKQSSJYJGmJnFfBOr6y9UCNvrjyqfLqBkpfOqzsuwGDkcKY0MtnY")' }}></div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500">
                      <span className="material-symbols-outlined">monitor_heart</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg HRV</p>
                      <p className="text-lg font-bold text-foreground">42ms <span className="text-xs font-normal text-red-400">(-2ms)</span></p>
                    </div>
                  </div>
                  <div className="h-10 w-16 bg-center bg-contain bg-no-repeat opacity-50" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBXcHSD72Sg7dUnqbj0O8-8x2wvPZCIYlu-p_3obV-TzRsU-CGx4tP6wIIFyXQhkYbWfp9q8wmNcqdUc--roycWtCRpq4TWIB0xysoenudg70U6_Bn8SsNjVTZMefuAbPjwIL5kIvZXOuR9N6HTbhSTVqHwYBTv_Ucn-4SzXSB4KX8nBncNuPiS2zweZFz0L3CkUkdQmMTUatVU4q4uTzq6EVwep-tP48muqicQ-ltC7-3Auh6U9-uH-yfnBDyEZkFbGw3eZw3XUnw")' }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Row: Symptom Cloud & Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-10">
          {/* Symptom Cloud */}
          <div className="rounded-xl p-6 bg-card border border-border shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-foreground text-lg font-bold">Symptom Frequency</h3>
              <span className="text-xs text-muted-foreground">Last 30 Days</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="px-4 py-2 rounded-lg bg-red-500/20 text-red-500 font-bold text-lg border border-red-500/20">Bloating (12)</div>
              <div className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-base border border-orange-500/20">Fatigue (8)</div>
              <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary font-bold text-base border border-primary/20">Cravings (7)</div>
              <div className="px-2 py-1 rounded-lg bg-secondary text-muted-foreground text-sm">Headache (4)</div>
              <div className="px-2 py-1 rounded-lg bg-secondary text-muted-foreground text-sm">Acne (3)</div>
              <div className="px-2 py-1 rounded-lg bg-secondary text-muted-foreground text-sm">Mood Swings (2)</div>
            </div>
          </div>

          {/* Education / Did you know */}
          <div className="rounded-xl p-6 bg-secondary border border-border/50 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-full shrink-0">
              <span className="material-symbols-outlined text-primary">school</span>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-foreground text-lg font-bold">Did you know?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                In the Luteal phase, your body temperature rises, and insulin sensitivity decreases. For PCOS management, focusing on steady-state cardio and complex carbs during this week can help manage symptoms like bloating and cravings.
              </p>
              <a className="text-foreground text-sm font-bold underline decoration-primary decoration-2 underline-offset-4 mt-2 hover:text-primary transition-colors" href="#">Read more about Luteal Phase training</a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Trends;