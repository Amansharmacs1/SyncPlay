import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon: Icon, title, description }) => {
  return (
    <div className="group relative rounded-2xl border border-surface-border bg-background-card p-8 transition-all duration-300 hover:border-accent-primary/50 hover:shadow-card hover:-translate-y-1">
      <div className="w-12 h-12 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center text-accent-secondary mb-6 group-hover:scale-110 group-hover:bg-accent-primary/20 transition-all">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold text-text-main mb-3 group-hover:text-white transition-colors">
        {title}
      </h3>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
    </div>
  );
};
