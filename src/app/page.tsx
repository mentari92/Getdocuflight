import Link from "next/link";
import LiveChatWrapper from "@/components/livechat/LiveChatWrapper";
import Logo from "@/components/brand/Logo";

export const metadata = {
  title: "GetDocuFlight — Visa Predictor",
  description:
    "Predict your visa approval chances with AI. Know your visa chances before you apply. Plus dummy tickets with verified PNR.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-surface">
      {/* ═══ Navbar ═══ */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-primary/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm font-medium text-muted hover:text-heading transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-sm shadow-primary/20"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══ Hero — Visa Predictor ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-surface to-gold-light/30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
          <h1
            className="text-4xl sm:text-6xl font-extrabold text-heading leading-tight mb-6 font-heading"
          >
            Know Your Visa Chances{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Before You Apply
            </span>
          </h1>

          <p className="text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Will your visa get approved? Find out instantly with our AI. Get a free preview or unlock your exact approval score for just $5. Don't let a rejection ruin your trip!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-primary text-white font-bold text-base rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:bg-primary-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              🔮 Get Free Preview →
            </Link>
            <Link
              href="/order"
              className="px-8 py-4 bg-surface text-heading font-bold text-base rounded-xl border-2 border-primary/20 hover:border-primary/40 transition-all hover:scale-[1.02] inline-block"
            >
              ✈️ Order Dummy Tickets
            </Link>
            <Link
              href="/smart-navigator"
              className="px-8 py-4 bg-gold text-white font-bold text-base rounded-xl shadow-lg shadow-gold/25 hover:bg-gold-dark transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              🧭 Smart Navigator
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Core Features ═══ */}
      <section className="py-20 bg-primary-50/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-center text-heading mb-4 font-heading">
            Everything You Need for Your Visa Journey
          </h2>
          <p className="text-base text-muted text-center mb-12 max-w-lg mx-auto">
            From AI powered predictions to verified dummy tickets, we have you covered.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: "🔮",
                title: "Visa Predictor",
                desc: "Get a free AI-powered preview of your visa chances. Pay $5 only when you want the full score, risk analysis, and professional recommendations.",
                gradient: "from-primary/10 to-secondary/10",
                border: "border-primary/20",
                badge: "MUST-TRY",
                link: "/register"
              },
              {
                icon: "✈️",
                title: "Dummy Flight Ticket",
                desc: "Flight reservation with verified PNR for your visa application. Only $10. Bundle with Hotel for just $20.",

                gradient: "from-gold-light/50 to-cream",
                border: "border-gold-border",
                badge: "POPULAR",
                link: "/order"
              },
              {
                icon: "🧭",
                title: "Smart Navigator",
                desc: "Instantly check visa requirements and generate a premium AI travel itinerary.",
                footer: "Real-time Global Visa Database",
                gradient: "from-primary/5 to-gold-light/20",
                border: "border-gold-border",
                badge: "TRENDING",
                link: "/smart-navigator"
              },
            ].map((f) => (
              <div
                key={f.title}
                className={`bg-gradient-to-br ${f.gradient} rounded-2xl p-8 border ${f.border} shadow-sm hover:shadow-md transition-shadow relative group flex flex-col`}
              >
                {f.link ? (
                  <Link href={f.link} className="absolute inset-0 z-10" />
                ) : null}
                {f.badge && (
                  <span className={`absolute top-4 right-4 text-[10px] font-bold ${f.badge === 'CORE' ? 'bg-primary' : 'bg-secondary'} text-white px-2 py-0.5 rounded-full`}>
                    {f.badge}
                  </span>
                )}
                <span className="text-4xl block mb-4">{f.icon}</span>
                <h3 className="text-lg font-bold text-heading mb-2 font-heading leading-tight">
                  {f.title}
                  {(f.title === "Visa Predictor" || f.title === "Smart Navigator") && (
                    <span className="ml-2 inline-flex items-center bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider align-middle">
                      AI Powered
                    </span>
                  )}
                  {f.link && <span className="ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity">→</span>}
                </h3>
                <p className="text-sm text-muted leading-relaxed mb-4">
                  {f.desc}
                </p>
                {f.footer && (
                  <p className="mt-auto text-[11px] font-bold text-muted/60 uppercase tracking-wider">
                    {f.footer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How Visa Predictor Works ═══ */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-extrabold text-center text-heading mb-12 font-heading">
            How Visa Predictor Works
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {[
              { step: "1", icon: "📝", label: "Complete travel profile" },
              { step: "2", icon: "🤖", label: "AI analyzes your profile" },
              { step: "3", icon: "📊", label: "Get approval prediction" },
              { step: "4", icon: "💡", label: "Get improvement tips" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md shadow-primary/20">
                  {s.step}
                </div>
                <span className="text-3xl block mb-2">{s.icon}</span>
                <p className="text-sm font-semibold text-body">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="py-20 bg-gradient-to-br from-primary-900 via-primary-dark to-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-extrabold !text-white mb-4 font-heading">
            Ready to Know Your Visa Chances?
          </h2>
          <p className="text-base text-primary-200 mb-8">
            Free preview included. Full analysis with score and recommendations is just $5.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-primary font-bold text-base rounded-xl hover:bg-primary-50 transition-all font-heading"
            >
              🔮 Get Free Preview
            </Link>
            <Link
              href="/order"
              className="px-8 py-4 bg-white/10 text-white font-bold text-base rounded-xl border border-white/20 hover:bg-white/20 transition-all inline-block font-heading"
            >
              ✈️ Order Dummy Ticket
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="py-16 bg-[#FFFDF0] border-t border-gold-border/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16 text-left">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <Logo />
              </Link>
              <p className="text-sm text-muted max-w-xs leading-relaxed">
                AI-powered visa predictions and verified dummy flight reservations for your visa application. Travel with confidence.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-heading mb-6 font-heading tracking-wide uppercase text-xs">Company</h4>
              <ul className="space-y-3 text-sm text-body">
                <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-heading mb-6 font-heading tracking-wide uppercase text-xs">Legal</h4>
              <ul className="space-y-3 text-sm text-body">
                <li><Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund-policy" className="hover:text-primary transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gold-border/30 text-center">
            <p className="text-[10px] text-muted uppercase tracking-[0.2em]">
              © {new Date().getFullYear()} GetDocuFlight — PRESERVING YOUR TRAVEL DREAMS.
            </p>
          </div>
        </div>
      </footer>

      {/* ═══ Live Chat Widget ═══ */}
      <div id="live-chat">
        <LiveChatWrapper />
      </div>
    </div>
  );
}
