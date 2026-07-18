import { Link } from "react-router-dom";

export default function LandingFooter() {
  return (
    <footer className="w-full bg-surface-container-lowest dark:bg-surface-container-lowest border-t border-outline-variant dark:border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-lg py-xl max-w-container-max mx-auto gap-md md:gap-0">
        <div className="font-display-lg text-headline-md font-bold text-primary tracking-tight">
          CodePro
        </div>
        <div className="flex flex-wrap justify-center gap-lg">
          <Link to="/" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-200">Product</Link>
          <Link to="/docs" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-200">Docs</Link>
          <Link to="/docs" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-200">API</Link>
          <a className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">GitHub</a>
          <Link to="/community" className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-200">Discord</Link>
          <a className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors duration-200" href="#">Contact</a>
        </div>
        <div className="font-body-md text-body-md text-on-surface-variant dark:text-on-surface-variant">
          © 2024 CodePro Inc. Built for performance.
        </div>
      </div>
    </footer>
  );
}
