import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Calendar, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";

export default function AnalysisCard({ analysis, onView, onDelete }) {
  const isAiGenerated = analysis?.data_source?.includes("AI Generated");

  const handleDeleteClick = () => {
    if (confirm(`Are you sure you want to delete the analysis for ${analysis.company_name}? This action cannot be undone.`)) {
      onDelete(analysis.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full">

      <Card className="bg-white shadow-sm border-slate-200 hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            {/* Left side content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <Building2 className="w-5 h-5 text-slate-500 flex-shrink-0" />
                <h3 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                  {analysis.company_name}
                </h3>
                <Badge variant="outline" className="text-xs">{analysis.industry}</Badge>
                {isAiGenerated &&
                <Badge className="bg-blue-100 text-blue-800 text-xs">AI Dossier</Badge>
                }
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-600 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {analysis.analysis_date ? format(new Date(analysis.analysis_date), 'MMM d, yyyy') : 'No Date'}
                </span>
                {analysis.employee_count &&
                <span className="text-xs text-slate-500">
                    {analysis.employee_count.toLocaleString()} employees
                  </span>
                }
              </div>
            </div>

            {/* Right side buttons - ALWAYS VISIBLE */}
            <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(analysis)} className="bg-green-500 text-[#ffffff] px-3 text-sm font-medium inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-9 rounded-md flex-1 sm:flex-none">


                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
                className="flex-1 sm:flex-none">

                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {analysis.executive_summary &&
          <div className="mt-4 pt-4 border-t border-slate-200/60">
              <h4 className="font-semibold text-slate-800 mb-2 text-sm">Executive Summary</h4>
              <p className="text-sm text-slate-700 line-clamp-3 break-all">
                {analysis.executive_summary}
              </p>
            </div>
          }
        </CardContent>
      </Card>
    </motion.div>);

}