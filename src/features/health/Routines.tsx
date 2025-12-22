import React from 'react';

const Routines: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto h-full relative scrollbar-hide bg-background">

      <div className="w-full max-w-[1200px] mx-auto p-4 md:p-8 flex flex-col gap-8 pb-24">

        {/* Hero Section */}
        <section className="flex flex-col gap-6 md:flex-row md:items-end justify-between">
          <div className="flex flex-col gap-3 max-w-2xl">
            <h1 className="text-foreground text-4xl md:text-5xl font-black leading-tight tracking-[-0.033em]">Rutinas de Entrenamiento</h1>
            <p className="text-muted-foreground text-lg font-normal leading-relaxed">
              Entrenamientos diseñados para sincronizarse con tu cuerpo. Encuentra el equilibrio perfecto para tu fase lútea y tus objetivos de gestión de SOP.
            </p>
          </div>
          {/* Current Status Card */}
          <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-4 min-w-[300px] shadow-lg">
            <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">water_drop</span>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Estado Actual</p>
              <p className="text-foreground text-lg font-bold">Fase Lútea • Día 22</p>
            </div>
          </div>
        </section>


        {/* Filters / Chips */}
        <section className="overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-primary text-primary-foreground px-5 text-sm font-medium transition-transform hover:scale-105">
              Todos
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-card border border-border hover:border-primary text-foreground px-5 text-sm font-medium transition-colors">
              Fase Folicular
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-card border border-border hover:border-primary text-foreground px-5 text-sm font-medium transition-colors">
              Fase Lútea
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-card border border-border hover:border-primary text-foreground px-5 text-sm font-medium transition-colors">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              Resistencia a Insulina
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-card border border-border hover:border-primary text-foreground px-5 text-sm font-medium transition-colors">
              <span className="material-symbols-outlined text-[18px]">self_improvement</span>
              Reducción de Estrés
            </button>
            <button className="flex h-9 items-center justify-center gap-x-2 rounded-full bg-card border border-border hover:border-primary text-foreground px-5 text-sm font-medium transition-colors">
              Fuerza
            </button>
          </div>
        </section>


        {/* Section 1: Recommended for Luteal Phase */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-2xl font-bold tracking-tight">Recomendado para tu Fase Lútea</h2>
            <a className="text-primary text-sm font-medium hover:underline" href="#">Ver todo</a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="@container">
              <div className="flex flex-col md:flex-row items-stretch rounded-xl shadow-md bg-card overflow-hidden hover:shadow-lg transition-shadow border border-transparent hover:border-border">
                <div className="w-full md:w-48 h-48 md:h-auto bg-cover bg-center shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA0LXt5PPEIyvUzafLMYXn5LtLJtAv_gJutTiIr5GjfYCrmY7tTYOiJQdT2nNejzo6bnah8xm3ic1MpScoXj0jUOJ5CRGh62raeugD1eEg48xLOa9qjPZvDRRFhwWdOTFwpDP4aEK8cJLKyo5hwVGJlCW896CKq4ZH1HbkX4RdPOnEv3FdT6j4zg5QrkVOiZOP_05H7Hh2CAB7fS2nAz7NNeETy6BjIMJnsaO0dIUNo-VMixDX0rDO3JrC6kuue16Wizz2zrc57JZ4")' }}></div>
                <div className="flex flex-1 flex-col justify-between p-5 gap-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-foreground text-xl font-bold leading-tight">Cardio de Estado Estable</h3>
                      <button className="text-muted-foreground hover:text-foreground"><span className="material-symbols-outlined">bookmark_add</span></button>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">Ideal para mantener la circulación sin elevar excesivamente el cortisol. Perfecto para días de energía media.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded bg-secondary text-xs text-muted-foreground font-medium">30 min</span>
                      <span className="px-2 py-1 rounded bg-secondary text-xs text-muted-foreground font-medium">Intensidad Media</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">monitor_heart</span>
                      <span>Salud Hormonal</span>
                    </div>
                    <button className="cursor-pointer flex items-center justify-center rounded-lg h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors shadow-lg">
                      Empezar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="@container">
              <div className="flex flex-col md:flex-row items-stretch rounded-xl shadow-md bg-card overflow-hidden hover:shadow-lg transition-shadow border border-transparent hover:border-border">
                <div className="w-full md:w-48 h-48 md:h-auto bg-cover bg-center shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBcFaIneGlurFmYzSmdyB-6kcbxnknn-l_0WL665Bk3TKu0NdjWkw4BllBEPCmRNqegfD7CHSlNQkl26KNHAW-jj-wxIYXVXWHGW_31lorE_jP6Qdt0pY7_br7g2MJzbT5KnY2qrTtWP4mjC_fCegvHZUc6K8FRpdH7TumQsOEGGSI2O2EIN1tsK6TKoJrmJjja254lGLr7Z01Ac8T6OvrRtZQeE2vYyeh690kZNlUYnd39jGlOMeLhH94B1mLVr4DvZn9YgfGEyWE")' }}></div>
                <div className="flex flex-1 flex-col justify-between p-5 gap-4">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-foreground text-xl font-bold leading-tight">Pilates Suelo Pélvico</h3>
                      <button className="text-muted-foreground hover:text-foreground"><span className="material-symbols-outlined">bookmark_add</span></button>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">Fortalece tu centro y mejora la circulación en la zona pélvica. Ejercicios de bajo impacto.</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded bg-secondary text-xs text-muted-foreground font-medium">20 min</span>
                      <span className="px-2 py-1 rounded bg-secondary text-xs text-muted-foreground font-medium">Bajo Impacto</span>
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <div className="flex items-center gap-1 text-primary text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">spa</span>
                      <span>Alivio SOP</span>
                    </div>
                    <button className="cursor-pointer flex items-center justify-center rounded-lg h-9 px-6 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors shadow-lg">
                      Empezar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Section 2: PCOS & Metabolic Health */}
        <section className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-foreground text-2xl font-bold tracking-tight">Gestión de Síntomas SOP</h2>
              <p className="text-muted-foreground text-sm mt-1">Enfocado en sensibilidad a la insulina y reducción de andrógenos.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Vertical Card 1 */}
            <div className="group flex flex-col bg-card rounded-xl overflow-hidden hover:shadow-lg transition-all border border-transparent hover:border-border">
              <div className="aspect-video w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDOVDFBPR2iadr2EMpb9EqCy-gjy3AGZHp6Mty5mBgVnnX_sLht_cRBosoosZeg6C2z1Yelnjp9P6czKntZEMlbxG5KWZpWKz0kms8tdN-Y2zgHC5lKPqnXtoUzt2aUkPUgvu9AQY_iuzkMdkir54nom1tRiWxY0gIwbuIYs6rjUr0KOyWmc9YTyJ8IUwow0xxIN7RTz9rHnrn4TVdPs66Z9GTiJiYqwhTrcifzUO6ZjqS9uRfGhI74ou5GcVnKpBLF5BtAWoWDNBc")' }}></div>
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-foreground text-lg font-bold">Fuerza Metabólica</h3>
                  <span className="bg-secondary text-foreground text-xs px-2 py-1 rounded font-medium">45 min</span>
                </div>
                <p className="text-muted-foreground text-sm flex-1">Entrenamiento de resistencia para mejorar la absorción de glucosa muscular.</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Alta Intensidad</span>
                  <button className="text-foreground hover:text-primary transition-colors"><span className="material-symbols-outlined">play_circle</span></button>
                </div>
              </div>
            </div>
            {/* Vertical Card 2 */}
            <div className="group flex flex-col bg-card rounded-xl overflow-hidden hover:shadow-lg transition-all border border-transparent hover:border-border">
              <div className="aspect-video w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCeuU0A95v21J5Jsv6FRIKrM2uJSTzELMk76Nz9LloOUnlgOVn8wOOizqi_izrMD00UC-r9awGWxtzDRK7z3de0IY4pnqEBbmQNYNrWxGNdDixs8ss6hCG0etC2LQRDTQuGILWpE8HGOG4B0qLwBAY8HOWWZaaz0e-3Q1Iitgv2W0nRBi8-VTLdsMsaOivLygHE6vuJsQ52JjoNnpoUaPD56afdzqe_WA5NL05Ft3eZ-YICLsRZlokoznAMsnrLBFVT4teHWk1W7DQ")' }}></div>
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-foreground text-lg font-bold">Yoga Restaurativo</h3>
                  <span className="bg-secondary text-foreground text-xs px-2 py-1 rounded font-medium">25 min</span>
                </div>
                <p className="text-muted-foreground text-sm flex-1">Reduce los niveles de cortisol y calma el sistema nervioso central.</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Baja Intensidad</span>
                  <button className="text-foreground hover:text-primary transition-colors"><span className="material-symbols-outlined">play_circle</span></button>
                </div>
              </div>
            </div>
            {/* Vertical Card 3 */}
            <div className="group flex flex-col bg-card rounded-xl overflow-hidden hover:shadow-lg transition-all border border-transparent hover:border-border">
              <div className="aspect-video w-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDN2d15Z7B8vOR0Mitk875W3xjCLnz_vZ5DexyCf0tuEFZzJEvqcT1RggXvPzXshn2aMQXZcuW_914ixVS8tUjOjFf9qj5Lh-FjQD8D1qnGREMgr6j87x4sjIKQSneGOZ4hDcTBrpWdWPrPQynOGl7dc6nrJl0NId292boC3tZlKvNZEY6Anis5gOzi9EK_VY10Ac3BPaLl4tXaG2YxV-8n8H0ReYNXCLbp__DlN_FJgnLy3vlBgDww_0J4pLuvA2cWIQgwmmOvqJg")' }}></div>
              <div className="p-4 flex flex-col flex-1 gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-foreground text-lg font-bold">Caminata Consciente</h3>
                  <span className="bg-secondary text-foreground text-xs px-2 py-1 rounded font-medium">15 min</span>
                </div>
                <p className="text-muted-foreground text-sm flex-1">Ejercicio simple post-comida para regular picos de insulina.</p>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">Muy Baja Intensidad</span>
                  <button className="text-foreground hover:text-primary transition-colors"><span className="material-symbols-outlined">play_circle</span></button>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* Privacy & Footer */}
        <footer className="mt-12 pt-8 border-t border-border text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border">
            <span className="material-symbols-outlined text-green-500 text-sm">lock</span>
            <span className="text-muted-foreground text-xs font-medium">Tus datos de salud están encriptados localmente. Tu privacidad es nuestra prioridad.</span>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            <a className="text-muted-foreground text-sm hover:text-foreground" href="#">Sobre Nosotros</a>
            <a className="text-muted-foreground text-sm hover:text-foreground" href="#">Privacidad</a>
            <a className="text-muted-foreground text-sm hover:text-foreground" href="#">Soporte</a>
          </div>
          <p className="text-primary/60 text-xs mt-4">© 2023 CycleFit. Todos los derechos reservados.</p>
        </footer>

      </div>
    </div>
  );
};

export default Routines;