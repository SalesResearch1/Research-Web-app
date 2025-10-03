import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function RegulatoryLinksSection({ links }) {
  if (!links || links.length === 0) {
    return (
      <p className="text-slate-600 text-sm">No regulatory search links have been saved for this dossier.</p>
    );
  }

  return (
    <div className="space-y-3">
      {links.map((link, index) => (
        <a 
          key={index}
          href={link.url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block"
        >
          <Card className="hover:bg-slate-50 transition-colors">
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-primary-700">{link.title}</p>
                <p className="text-xs text-slate-500">
                  {link.database} &bull; Searched on {format(new Date(link.search_date), 'MMM d, yyyy')}
                </p>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </CardContent>
          </Card>
        </a>
      ))}
    </div>
  );
}