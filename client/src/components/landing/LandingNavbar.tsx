import { Link } from "react-router-dom";
import { useAppStore } from "../../store/useAppStore";

export default function LandingNavbar() {
  const { user, logout } = useAppStore();

  return (
    <nav className="w-full top-0 sticky z-50 bg-background dark:bg-background border-b border-outline-variant dark:border-outline-variant">
      <div className="flex justify-between items-center px-lg py-md max-w-container-max mx-auto">
        <div className="flex items-center gap-xl">
          <Link to="/" className="font-display-lg text-headline-md font-bold text-primary dark:text-primary tracking-tight">CodePro</Link>
          <div className="hidden md:flex items-center gap-lg">
            <Link to="/problems" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors duration-200">Problems</Link>
            <Link to="/workspace" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors duration-200">Compiler</Link>
            <Link to="/ai" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors duration-200">AI Assistant</Link>
            <Link to="/pricing" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors duration-200">Pricing</Link>
            <Link to="/docs" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors duration-200">Docs</Link>
            <Link to="/community" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-on-surface transition-colors duration-200">Community</Link>
          </div>
        </div>
        <div className="flex items-center gap-md">
          {user ? (
            <>
              <div className="flex items-center gap-sm mr-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <span className="font-body-md text-on-surface font-medium hidden md:block">
                  {user.email.split('@')[0]}
                </span>
              </div>
              <button
                onClick={logout}
                className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors" to="/login">Login</Link>
              <Link to="/signup" className="font-body-md text-body-md bg-primary text-on-primary px-md py-sm rounded-lg hover:bg-opacity-90 transition-colors font-medium">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
