import React from "react";
import LandingNavbar from "../landing/LandingNavbar";
import LandingFooter from "../landing/LandingFooter";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col">
      <LandingNavbar />
      <main className="flex-grow flex flex-col">{children}</main>
      <LandingFooter />
    </div>
  );
}
