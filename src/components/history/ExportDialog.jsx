import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { logDataExported } from '@/components/utils/analytics';

export default function ExportDialog({ isOpen, onClose, data }) {
  const [exportFormat, setExportFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      if (data.length === 0) {
        onClose();
        setIsExporting(false);
        return;
      }
      
      const exportData = data.map(analysis => ({
        'Company Name': analysis.company_name,
        'Industry': analysis.industry,
        'Analysis Date': format(new Date(analysis.analysis_date), 'yyyy-MM-dd')
      }));

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle null/undefined and strings containing commas
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            return typeof stringValue === 'string' && stringValue.includes(',') ? `"${stringValue}"` : stringValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `safety-analyses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      
      link.click();
      
      // Log the data export event
      logDataExported(exportFormat.toUpperCase(), data.length);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      link.remove(); // More modern way to remove element
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    }
    
    setIsExporting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Analysis Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Export Format
            </label>
            <Select value={exportFormat} onValueChange={setExportFormat} disabled>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-slate-600">
            Exporting {data.length} analyses with key safety data.
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || data.length === 0}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}