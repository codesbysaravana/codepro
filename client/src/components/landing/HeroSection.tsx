import { Link } from "react-router-dom";

export default function HeroSection() {
  return (
    <section className="max-w-container-max mx-auto px-lg pt-24 pb-xl grid grid-cols-1 lg:grid-cols-2 gap-xl items-center">
      <div className="flex flex-col gap-lg">
        <div className="inline-flex items-center gap-sm px-md py-xs rounded-full bg-surface-container border border-outline-variant w-fit">
          <span className="material-symbols-outlined text-primary text-sm icon-fill">bolt</span>
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">CodePro Engine v2.0 Live</span>
        </div>
        <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface">
          Build. Compile. <br /><span className="text-primary">Execute.</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
          The ultimate high-performance cloud IDE. Write code in over many popular languages, compile instantly, and execute in a secure sandbox with zero setup.
        </p>
        <div className="flex items-center gap-md pt-sm">
          <Link to="/workspace" className="bg-primary text-on-primary px-lg py-md rounded-lg font-body-md font-medium hover:bg-opacity-90 transition-colors flex items-center gap-sm">
            Start Coding <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
          <button className="bg-transparent border border-outline-variant text-on-surface px-lg py-md rounded-lg font-body-md hover:bg-surface transition-colors flex items-center gap-sm">
            <span className="material-symbols-outlined">play_circle</span> View Demo
          </button>
        </div>
        <div className="grid grid-cols-3 gap-md pt-xl border-t border-outline-variant mt-md">
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">100K+</div>
            <div className="font-label-md text-label-md text-on-surface-variant">Daily Executions</div>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">50+</div>
            <div className="font-label-md text-label-md text-on-surface-variant">Languages</div>
          </div>
          <div>
            <div className="font-headline-md text-headline-md text-on-surface">99.9%</div>
            <div className="font-label-md text-label-md text-on-surface-variant">Uptime</div>
          </div>
        </div>
      </div>
      <div className="relative w-full rounded-xl border border-outline-variant bg-surface overflow-hidden shadow-2xl min-w-0">
        <div className="h-10 bg-surface-container-high border-b border-outline-variant flex items-center px-md gap-sm">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
          <div className="mx-auto font-code-sm text-code-sm text-on-surface-variant opacity-70">codepro-workspace</div>
        </div>
        <img className="w-full h-auto object-cover" alt="IDE Preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYVimPjQs73nVl7ypkAplgTyBHjkGmh5pMPvc6kkKSkx5MI9X7Dlwv99NzzT4JTPtpnlee8cvKGd8yb0Zrge9Me7vCWA9qhdwDyhQb_YhGLGeKfz5_Lqfg4p6MvE281xFKqjHbM807U76sMDYKSYgnE5YXKITDNGbUiqUgEXq1hmGrKavhIZZl6CV9SN7NMrJvfUOnusGmNUcZ930MaK92aHi6QL3NgYivmpEJLXk9Xg5WE_XsCp_bWx--XdAtG_6dvPp90EiIlQWr" />
      </div>
    </section>
  );
}
