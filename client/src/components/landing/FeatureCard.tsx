import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="group relative rounded-2xl border border-surface-border bg-white p-8 transition-all duration-300 hover:border-accent-primary/40 hover:shadow-card hover:-translate-y-1">
      <div className="w-12 h-12 rounded-xl bg-accent-light border border-accent-primary/20 flex items-center justify-center text-accent-primary mb-6 group-hover:scale-110 group-hover:bg-accent-primary group-hover:text-white transition-all shadow-xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-text-main mb-3 group-hover:text-accent-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-text-muted leading-relaxed font-normal">{description}</p>
    </div>
  );
};
