import MainLayout from "../components/layout/MainLayout";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: string;
}

export default function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <MainLayout>
      <div className="flex-grow flex items-center justify-center p-xl text-center">
        <div className="max-w-md bg-surface border border-outline-variant rounded-2xl p-xl shadow-2xl flex flex-col items-center gap-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-sm">
            <span className="material-symbols-outlined text-primary text-4xl">{icon}</span>
          </div>
          <h1 className="font-display-lg text-headline-md font-bold text-on-surface">{title}</h1>
          <p className="font-body-md text-on-surface-variant leading-relaxed">
            {description}
          </p>
          <button className="mt-md px-lg py-sm bg-primary text-on-primary rounded-lg font-label-md hover:bg-primary/90 transition-colors">
            Notify Me
          </button>
        </div>
      </div>
    </MainLayout>
  );
}
