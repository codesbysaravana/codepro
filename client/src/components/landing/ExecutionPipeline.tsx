export default function ExecutionPipeline() {
  return (
    <section className="bg-surface-container-low py-xl border-y border-outline-variant">
      <div className="max-w-container-max mx-auto px-lg text-center">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-xl">The Execution Pipeline</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-md md:gap-4 w-full">
          <div className="flex flex-col items-center bg-surface border border-outline-variant p-md rounded-lg w-full md:w-1/5">
            <span className="material-symbols-outlined text-on-surface-variant mb-sm">code</span>
            <span className="font-label-md text-label-md">Write Code</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant hidden md:block">arrow_forward</span>
          <span className="material-symbols-outlined text-outline-variant md:hidden">arrow_downward</span>
          <div className="flex flex-col items-center bg-surface border border-outline-variant p-md rounded-lg w-full md:w-1/5">
            <span className="material-symbols-outlined text-on-surface-variant mb-sm">terminal</span>
            <span className="font-label-md text-label-md">Compile</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant hidden md:block">arrow_forward</span>
          <span className="material-symbols-outlined text-outline-variant md:hidden">arrow_downward</span>
          <div className="flex flex-col items-center bg-surface border border-outline-variant p-md rounded-lg w-full md:w-1/5">
            <span className="material-symbols-outlined text-primary mb-sm icon-fill">rocket_launch</span>
            <span className="font-label-md text-label-md text-primary">Execute</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant hidden md:block">arrow_forward</span>
          <span className="material-symbols-outlined text-outline-variant md:hidden">arrow_downward</span>
          <div className="flex flex-col items-center bg-surface border border-outline-variant p-md rounded-lg w-full md:w-1/5">
            <span className="material-symbols-outlined text-on-surface-variant mb-sm">bug_report</span>
            <span className="font-label-md text-label-md">Test Cases</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant hidden md:block">arrow_forward</span>
          <span className="material-symbols-outlined text-outline-variant md:hidden">arrow_downward</span>
          <div className="flex flex-col items-center bg-surface border border-outline-variant p-md rounded-lg w-full md:w-1/5">
            <span className="material-symbols-outlined text-on-surface-variant mb-sm">task_alt</span>
            <span className="font-label-md text-label-md">Instant Results</span>
          </div>
        </div>
      </div>
    </section>
  );
}
