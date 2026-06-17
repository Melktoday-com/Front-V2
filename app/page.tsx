
export default function Home() {
  return (
    <main className="min-h-screen bg-soft-bg p-8 flex flex-col items-center gap-8 text-right">
      <h1 className="text-3xl font-bold text-brand">Melktoday Design System</h1>

      {/* Colors Section */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-[30px] shadow-sm border border-soft-border">
        <h2 className="text-xl font-bold mb-6 text-brand">پالت رنگی (Colors)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-20 bg-primary rounded-2xl shadow-inner"></div>
            <p className="text-center text-sm font-bold">Primary</p>
            <p className="text-center text-xs text-text-light">#8BC83F</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-brand rounded-2xl shadow-inner"></div>
            <p className="text-center text-sm font-bold">Brand Navy</p>
            <p className="text-center text-xs text-text-light">#252B5C</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-secondary rounded-2xl shadow-inner"></div>
            <p className="text-center text-sm font-bold">Secondary</p>
            <p className="text-center text-xs text-text-light">#53587A</p>
          </div>
          <div className="space-y-2">
            <div className="h-20 bg-soft-bg border border-soft-border rounded-2xl"></div>
            <p className="text-center text-sm font-bold">Soft BG</p>
            <p className="text-center text-xs text-text-light">#F5F4F8</p>
          </div>
        </div>
      </section>

      {/* Buttons Section */}
      <section className="w-full max-w-4xl bg-white p-8 rounded-[30px] shadow-sm border border-soft-border">
        <h2 className="text-xl font-bold mb-6 text-brand">دکمه‌ها (Buttons)</h2>
        <div className="flex flex-wrap gap-4 justify-start">
          <button className="bg-primary text-white px-8 py-4 rounded-button font-bold shadow-md transition-transform hover:scale-105 active:scale-95">
            دکمه اصلی (Primary)
          </button>
          <button className="bg-brand text-white px-8 py-4 rounded-button font-bold shadow-md transition-transform hover:scale-105 active:scale-95">
            دکمه برند (Brand)
          </button>
          <button className="bg-white text-secondary border border-soft-border px-8 py-4 rounded-button font-bold shadow-sm transition-transform hover:scale-105 active:scale-95">
            دکمه ثانویه
          </button>
        </div>
      </section>

      {/* Components Example */}
      <section className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-soft-border">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-brand">آپارتمان لوکس</h3>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold">برای فروش</span>
          </div>
          <p className="text-text-main text-sm mb-4">یک آپارتمان مدرن در مرکز شهر با دسترسی عالی به امکانات رفاهی.</p>
          <div className="flex justify-between items-center border-t border-soft-border pt-4">
            <span className="text-xl font-bold text-brand">۲.۵ میلیارد تومان</span>
            <span className="text-text-light text-xs">تهران، سعادت آباد</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-soft-border">
          <h3 className="text-lg font-bold text-brand mb-4 text-right">انتخاب نوع معامله</h3>
          <div className="flex bg-soft-bg p-1.5 rounded-2xl">
            <button className="flex-1 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-sm">اجاره</button>
            <button className="flex-1 py-2.5 text-text-main rounded-xl text-sm font-bold">خرید</button>
          </div>
        </div>
      </section>
    </main>
  );
}

