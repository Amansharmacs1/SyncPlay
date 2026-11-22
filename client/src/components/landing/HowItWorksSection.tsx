import React from 'react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Create.',
      desc: 'Start a room with one click. Choose an optional title or password, or keep it open for quick sharing.',
    },
    {
      num: '02',
      title: 'Invite.',
      desc: 'Send friends your private room link or 6-digit code. No app install or registration needed.',
    },
    {
      num: '03',
      title: 'Watch & Talk.',
      desc: 'Paste any YouTube or MP4 video link. Playback stays frame-synchronized with live FaceTime calling.',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="text-xs sm:text-sm uppercase tracking-wide text-[#0071E3] font-semibold mb-2">
          Effortless by Design
        </h2>
        <p className="text-3xl sm:text-4xl font-semibold text-[#1D1D1F] tracking-tight">
          How SyncPlay works.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step) => (
          <div
            key={step.num}
            className="apple-card p-8 bg-white flex flex-col justify-between"
          >
            <div>
              <span className="text-xs font-semibold text-[#0071E3] tracking-widest font-mono block mb-4">
                STEP {step.num}
              </span>
              <h3 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[#86868B] leading-relaxed font-normal">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
