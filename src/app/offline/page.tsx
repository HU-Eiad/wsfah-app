export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background-light text-espresso flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center gap-2.5 mb-8">
          <span className="size-10 rounded-xl bg-forest text-paper flex items-center justify-center">
            <span
              className="wsfa-icon"
              style={{ "--icon": "url(/brand/wsfa-mark.svg)", fontSize: 24 } as React.CSSProperties}
              aria-hidden
            />
          </span>
          <span className="font-display text-2xl font-semibold">وصفة</span>
        </div>
        <img src="/brand/banners/empty-state.svg" alt="" className="w-40 mx-auto mb-4" />
        <h1 className="text-2xl mb-3">أنت غير متصل</h1>
        <p className="text-sm text-espresso/60 leading-relaxed">
          اتصل بالإنترنت لمتابعة تصفح وصفة.
        </p>
      </div>
    </div>
  );
}
