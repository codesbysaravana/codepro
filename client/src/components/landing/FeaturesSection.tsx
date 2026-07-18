export default function FeaturesSection() {
  return (
    <section className="max-w-container-max mx-auto px-lg py-xl border-t border-outline-variant border-opacity-50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-surface border border-outline-variant rounded-xl p-lg hover:border-primary transition-colors group">
          <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center mb-md group-hover:bg-primary group-hover:bg-opacity-10 transition-colors">
            <span className="material-symbols-outlined text-primary">bolt</span>
          </div>
          <h3 className="font-headline-md text-body-lg font-semibold text-on-surface mb-sm">Fast Cloud Execution</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">Compile and run code in milliseconds. Our distributed infrastructure ensures minimal latency regardless of your location.</p>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-lg hover:border-primary transition-colors group">
          <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center mb-md group-hover:bg-primary group-hover:bg-opacity-10 transition-colors">
            <span className="material-symbols-outlined text-primary">language</span>
          </div>
          <h3 className="font-headline-md text-body-lg font-semibold text-on-surface mb-sm">Multi-language Support</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">From system languages like Rust and C++ to modern web scripts like TypeScript and Python, we support over 50 ecosystems.</p>
        </div>
        <div className="bg-surface border border-outline-variant rounded-xl p-lg hover:border-primary transition-colors group">
          <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant flex items-center justify-center mb-md group-hover:bg-primary group-hover:bg-opacity-10 transition-colors">
            <span className="material-symbols-outlined text-primary">shield_lock</span>
          </div>
          <h3 className="font-headline-md text-body-lg font-semibold text-on-surface mb-sm">Secure Sandbox</h3>
          <p className="font-body-md text-body-md text-on-surface-variant">Every execution runs in an isolated, secure container preventing memory leaks, malicious code, and resource exhaustion.</p>
        </div>
      </div>
    </section>
  );
}
