import Link from "next/link";

function Wordmark({ size = "md" }: { size?: "md" | "sm" }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className={`${size === "md" ? "size-10 rounded-xl" : "size-8 rounded-lg"} bg-forest text-paper flex items-center justify-center`}>
        <span
          className="wsfa-icon"
          style={{ "--icon": "url(/brand/wsfa-mark.svg)", fontSize: size === "md" ? 24 : 18 } as React.CSSProperties}
          aria-hidden
        />
      </span>
      <span className={`font-display ${size === "md" ? "text-2xl" : "text-xl"} font-semibold`}>وصفة</span>
    </span>
  );
}

export default function RefundPolicyPage() {
  return (
    <div className="bg-background-light text-espresso min-h-screen">
      {/* Nav - matches landing page */}
      <nav className="sticky top-0 z-50 bg-background-light/85 backdrop-blur-xl border-b border-espresso/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" aria-label="وصفة، الصفحة الرئيسية">
            <Wordmark />
          </Link>
          <Link href="/login" className="text-sm font-semibold text-espresso/70 hover:text-espresso">
            تسجيل الدخول
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-14 md:py-20">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl mb-4">سياسة الاسترداد</h1>
          <p className="text-base text-espresso/70 leading-loose">
            قواعدنا المتعلقة بالمدفوعات والإلغاءات وأهلية الاسترداد
          </p>
        </header>

        {/* Policies */}
        <div>
          {[
            {
              num: "01",
              icon: "event_available",
              title: "إلغاء الاشتراك خلال ١٤ يوم",
              body: "لا يمكن إلغاء الاشتراك في الباقات (السنوية، الشهرية) إلا خلال ١٤ يوم من تفعيلها لأول مرة، ويتم معالجة استرداد المبالغ المدفوعة خلال ١٤ يوم.",
            },
            {
              num: "02",
              icon: "schedule",
              title: "الإلغاء بعد ١٤ يوم",
              body: "في حال إلغاء الاشتراك في إحدى الباقات المدفوعة بعد ١٤ يوم من تفعيلها، يمكنك الاستمرار في استخدام الباقة والاستفادة من مزاياها حتى تاريخ انتهاء الاشتراك ولا يمكن استرجاع مبلغ الاشتراك.",
            },
            {
              num: "03",
              icon: "autorenew",
              title: "التجديد التلقائي",
              body: "عند تفعيل خيار تجديد الاشتراك تلقائياً، تتم معالجة رسوم الاشتراك تلقائياً بمجرد إصدار فاتورة الاشتراك الجديدة.",
            },
            {
              num: "04",
              icon: "block",
              title: "عدم الاسترداد بعد تسليم الخدمة",
              body: "لن يتم إصدار استرداد للمبالغ في الحالات التي يغير فيها العميل رأيه بعد تسليم الخدمة كما وُعد.",
            },
            {
              num: "05",
              icon: "local_offer",
              title: "العروض الترويجية والخصومات",
              body: "تتم معالجة استرداد المبالغ المعتمدة على الخدمات التي تم شراؤها من خلال العروض الترويجية أو الخصومات بناءً على المبلغ الفعلي الذي دفعه العميل.",
            },
          ].map((item, i) => (
            <section
              key={item.num}
              className={`py-8 ${i > 0 ? "border-t border-espresso/10" : "pt-0"}`}
            >
              <h2 className="text-xl mb-3">{item.title}</h2>
              <p className="text-base text-espresso/70 leading-loose">{item.body}</p>
            </section>
          ))}
        </div>

        {/* Contact */}
        <section className="mt-12 bg-surface rounded-2xl border border-espresso/10 p-6 md:p-8">
          <h2 className="text-xl mb-2">تحتاج مساعدة؟</h2>
          <p className="text-sm text-espresso/70 leading-relaxed mb-5">للاستفسارات حول الاسترداد والمدفوعات</p>
          <a
            href="mailto:support@wsfa.app"
            dir="ltr"
            className="inline-block bg-primary text-on-primary rounded-xl px-5 py-3 font-bold text-sm hover:bg-primary/90 transition-colors"
          >
            support@wsfa.app
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-espresso/10 py-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Wordmark size="sm" />
          <p className="text-xs text-espresso/60">© {new Date().getFullYear()} وصفة. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
    </div>
  );
}
