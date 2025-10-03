import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

const InsightBadge = ({ className, insight, ...props }) => {
  return (
    <div className={cn("flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800", className)} {...props}>
        <Lightbulb className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
        <span className="text-xs">{insight}</span>
    </div>
  );
};

export default InsightBadge;