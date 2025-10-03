
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ListChecks,
  FileText,
  DollarSign,
  Leaf,
  Users,
  Shield, 
  Award,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Loader2,
  FileDown,
  FileSearch,
  Star,
  ExternalLink,
  Search, 
  AlertTriangle, 
  Target, 
  Edit3,
  Save,
  Check,
  Handshake,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { jsPDF } from "jspdf";
import InsightBadge from "../common/InsightBadge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CaseStudyGenerator from "../dossier/CaseStudyGenerator";
import EnvironmentalRegulationsSection from '../dossier/EnvironmentalRegulationsSection';
import RegulatoryLinksSection from '../dossier/RegulatoryLinksSection';
import { logDossierViewed, logPDFDownloaded } from '@/components/utils/analytics';
import { SafetyAnalysis } from "@/api/entities";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

const sanitizeText = (text) => {
  if (typeof text !== 'string') return text;
  // Remove markdown links, keeping the link text. e.g., [Google](google.com) -> Google
  let sanitized = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove raw URLs. This regex targets common URL patterns.
  sanitized = sanitized.replace(/https?:\/\/\S+/g, '');
  return sanitized.trim();
};

const SourceLink = ({ source }) => {
  if (!source || typeof source !== 'string' || source.trim() === '') {
    return <span className="text-slate-500 italic">No source information available</span>;
  }
  
  // Handle markdown links like [Text](url)
  const markdownMatch = source.match(/\[([^\]]+)\]\(([^)]+)\)/);
  if (markdownMatch) {
    return (
      <a 
        href={markdownMatch[2]} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary-600 hover:underline inline-flex items-center gap-1"
      >
        {markdownMatch[1]}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }
  
  // Handle raw URLs
  if (source.trim().startsWith('http://') || source.trim().startsWith('https://')) {
    return (
      <a 
        href={source} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary-600 hover:underline break-all inline-flex items-center gap-1"
      >
        {source}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }
  
  // Handle text that should be a google search like [Text]
  const searchMatch = source.match(/^\[(.*?)\]$/);
  if (searchMatch) {
    const query = encodeURIComponent(searchMatch[1]);
    return (
      <a 
        href={`https://www.google.com/search?q=${query}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-primary-600 hover:underline inline-flex items-center gap-1"
      >
        {searchMatch[1]}
        <Search className="w-3 h-3" />
      </a>
    );
  }

  // For any other text, just display it as-is
  return <span className="text-slate-700">{source}</span>;
};

const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, badge = null }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-primary-600" />
                    <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
                    {badge && <Badge variant="secondary" className="ml-2">{badge}</Badge>}
                </div>
                {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 px-4 pb-2">
                {children}
            </CollapsibleContent>
        </Collapsible>);

};

const BulletedList = ({ items, bulletClass }) =>
<ul className="space-y-2">
        {items.map((item, i) =>
  <li key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 ${bulletClass} rounded-full mt-1.5 flex-shrink-0`}></div>
                <span className="text-slate-700">{sanitizeText(item)}</span>
            </li>
  )}
    </ul>;


const CompanyProfileSection = ({ analysis }) =>
<div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.annual_revenue &&
    <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Annual Revenue</h4>
                    <p className="text-sm text-slate-700">${analysis.annual_revenue?.toLocaleString()}</p>
                </div>
    }
            {analysis.employee_count &&
    <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Employees</h4>
                    <p className="text-sm text-slate-700">{analysis.employee_count?.toLocaleString()}</p>
                </div>
    }
            {analysis.naics_code &&
    <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">NAICS Code</h4>
                    <p className="text-sm text-slate-700">{analysis.naics_code}</p>
                </div>
    }
            {analysis.headquarters_location &&
    <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Headquarters</h4>
                    <p className="text-sm text-slate-700">{analysis.headquarters_location}</p>
                </div>
    }
            {analysis.profit_margin_percentage &&
    <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Profit Margin</h4>
                    <p className="text-sm text-slate-700">{analysis.profit_margin_percentage}%</p>
                </div>
    }
            {analysis.cash_flow_indicators &&
    <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Cash Flow Health</h4>
                    <p className="text-sm text-slate-700">{analysis.cash_flow_indicators}</p>
                </div>
    }
        </div>

        {analysis.business_description &&
  <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2">Business Description</h4>
                <p className="text-sm text-slate-700">{sanitizeText(analysis.business_description)}</p>
            </div>
  }

        {analysis.key_products_services && analysis.key_products_services.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-2">Key Products & Services</h4>
                <BulletedList items={analysis.key_products_services} bulletClass="bg-indigo-500" />
            </div>
  }
    </div>;


const EHSPerformanceSection = ({ analysis }) =>
<div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Display Company TRIR - show 0 if it's 0, hide if null/undefined */}
            {(analysis.trir !== null && analysis.trir !== undefined) &&
    <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Company TRIR</h4>
                    <p className="text-sm text-blue-700 font-medium">{analysis.trir}</p>
                </div>
    }
            {analysis.recent_osha_penalties &&
    <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-semibold text-slate-800 mb-2">Recent OSHA Penalties</h4>
                    <p className="text-sm text-red-700 font-medium">${analysis.recent_osha_penalties?.toLocaleString()}</p>
                </div>
    }
        </div>

        {analysis.common_injury_types && analysis.common_injury_types.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3">Common Injury Types</h4>
                <BulletedList items={analysis.common_injury_types} bulletClass="bg-red-500" />
            </div>
  }

        {analysis.notable_incidents && analysis.notable_incidents.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3">Notable Incidents</h4>
                <BulletedList items={analysis.notable_incidents} bulletClass="bg-red-500" />
            </div>
  }

        {analysis.financial_risk_factors && analysis.financial_risk_factors.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3">Financial Risk Factors (SEC Filings)</h4>
                <BulletedList items={analysis.financial_risk_factors} bulletClass="bg-amber-500" />
            </div>
  }

        {analysis.regulatory_history && analysis.regulatory_history.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3">Regulatory History</h4>
                <BulletedList items={analysis.regulatory_history} bulletClass="bg-red-500" />
            </div>
  }
    </div>;


const ESGSection = ({ analysis }) =>
<div className="space-y-6">
        {analysis.social_programs && analysis.social_programs.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    Social Programs
                </h4>
                <BulletedList items={analysis.social_programs} bulletClass="bg-purple-500" />
            </div>
  }

        {analysis.governance_practices && analysis.governance_practices.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    Governance Practices
                </h4>
                <BulletedList items={analysis.governance_practices} bulletClass="bg-indigo-500" />
            </div>
  }

        {analysis.sustainability_goals && analysis.sustainability_goals.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Sustainability Goals
                </h4>
                <BulletedList items={analysis.sustainability_goals} bulletClass="bg-green-500" />
            </div>
  }
    </div>;


const EnvironmentalSummarySection = ({ analysis }) =>
<div className="space-y-6">
        {/* New Industry-Specific Regulations */}
        {analysis.applicable_environmental_programs &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3">Applicable Regulatory Landscape</h4>
                <EnvironmentalRegulationsSection regulations={analysis.applicable_environmental_programs} />
            </div>
  }

        {/* Existing AI-found programs */}
        {analysis.environmental_programs && analysis.environmental_programs.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    AI-Identified Environmental & Sustainability Programs
                </h4>
                <BulletedList items={analysis.environmental_programs} bulletClass="bg-green-500" />
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                        <strong>Note:</strong> This information includes specific EPA regulatory actions, permits, or voluntary initiatives found by the AI in public databases and company disclosures.
                    </p>
                </div>
            </div>
  }
    </div>;



const AwardsSection = ({ analysis }) =>
<div className="space-y-6">
        {analysis.esg_awards_recognitions && analysis.esg_awards_recognitions.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3">Awards & Recognition</h4>
                <BulletedList items={analysis.esg_awards_recognitions} bulletClass="bg-amber-500" />
            </div>
  }

        {analysis.esg_ratings && analysis.esg_ratings.length > 0 &&
  <div>
                <h4 className="font-semibold text-slate-800 mb-3">ESG Ratings</h4>
                <BulletedList items={analysis.esg_ratings} bulletClass="bg-green-500" />
            </div>
  }
    </div>;


const SafetyPaysSection = ({ analysis }) => {
  if (!analysis.safety_pays_calculation) return null;

  const calc = analysis.safety_pays_calculation;

  return (
    <div className="space-y-4">
            {/* Explanation of Safety Pays */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">How Safety Pays Works</h4>
                <p className="text-sm text-blue-800">
                    OSHA's Safety Pays tool uses national injury cost data to estimate the direct cost (medical bills, comp) for a specific injury. It then applies a default indirect cost multiplier (often 2.12) to account for lost productivity, training, and other hidden expenses. These are added to get the total cost. The tool then divides that total by your company's profit margin to show how much extra sales revenue is needed to cover the loss.
                </p>
            </div>

            {/* Summary Card */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                    <div>
                        <h4 className="font-semibold text-slate-800">Direct Costs</h4>
                        <p className="text-lg font-bold text-blue-600">${calc.total_direct_costs?.toLocaleString()}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-slate-800">Indirect Costs</h4>
                        <p className="text-lg font-bold text-blue-600">${calc.total_indirect_costs?.toLocaleString()}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-red-800">Combined Total</h4>
                        <p className="text-lg font-bold text-red-600">${calc.combined_total_cost?.toLocaleString()}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-green-800">Sales Needed</h4>
                        <p className="text-lg font-bold text-green-600">${calc.sales_needed_to_cover?.toLocaleString()}</p>
                    </div>
                </div>
                <div className="mt-3 text-center text-sm text-slate-600">
                    Based on {calc.profit_margin_used}% profit margin • Calculated on {calc.calculation_date}
                </div>
            </div>

            {/* Injury Breakdown */}
            {calc.selected_injuries_breakdown && calc.selected_injuries_breakdown.length > 0 &&
      <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Injury Cost Breakdown</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="text-left p-2 font-medium">Injury Type</th>
                                    <th className="text-right p-2 font-medium">Count</th>
                                    <th className="text-right p-2 font-medium">Direct Cost</th>
                                    <th className="text-right p-2 font-medium">Indirect Cost</th>
                                    <th className="text-right p-2 font-medium">Total Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calc.selected_injuries_breakdown.map((injury, i) =>
              <tr key={i} className="border-t border-slate-200">
                                        <td className="p-2 font-medium">{injury.label}</td>
                                        <td className="p-2 text-right">{injury.count}</td>
                                        <td className="p-2 text-right">${(injury.direct_cost * injury.count).toLocaleString()}</td>
                                        <td className="p-2 text-right">${(injury.indirect_cost * injury.count).toLocaleString()}</td>
                                        <td className="p-2 text-right font-semibold">${injury.total_cost?.toLocaleString()}</td>
                                    </tr>
              )}
                            </tbody>
                        </table>
                    </div>
                </div>
      }
        </div>);

};

const CanadianSafetySection = ({ analysis }) => {
    const canadaInfo = analysis.canada_safety_information;
    if (!canadaInfo) return null;

    return (
        <div className="space-y-6">
            {/* Federal Regulations Overview */}
            {canadaInfo.federal_regulations_overview && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        🇨🇦 Federal Regulations Overview
                    </h4>
                    <p className="text-slate-700 p-3 bg-blue-50 rounded-lg">
                        {sanitizeText(canadaInfo.federal_regulations_overview)}
                    </p>
                </div>
            )}

            {/* Provincial Regulations */}
            {canadaInfo.provincial_regulations && canadaInfo.provincial_regulations.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Provincial Regulations</h4>
                    <div className="space-y-3">
                        {canadaInfo.provincial_regulations.map((prov, i) => (
                            <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                                <h5 className="font-medium text-green-900 mb-1">{prov.province}</h5>
                                <p className="text-sm text-green-800">{sanitizeText(prov.regulation_summary)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Canadian Incidents & Penalties */}
            {canadaInfo.canadian_incidents_penalties && canadaInfo.canadian_incidents_penalties.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Canadian Incidents & Penalties</h4>
                    <BulletedList items={canadaInfo.canadian_incidents_penalties} bulletClass="bg-red-500" />
                </div>
            )}

            {/* Regulatory Bodies */}
            {canadaInfo.regulatory_bodies && canadaInfo.regulatory_bodies.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Relevant Canadian Regulatory Bodies</h4>
                    <BulletedList items={canadaInfo.regulatory_bodies} bulletClass="bg-indigo-500" />
                </div>
            )}

            {/* Canadian Sources */}
            {canadaInfo.canadian_sources && canadaInfo.canadian_sources.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Canadian Sources Referenced</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                        {canadaInfo.canadian_sources.map((source, i) => (
                            <li key={i}><SourceLink source={source} /></li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default function AnalysisDetailsDialog({ analysis: analysisProp, onClose }) {
  const [analysis, setAnalysis] = useState(analysisProp);
  const [isDownloading, setIsDownloading] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    if (analysisProp) {
      logDossierViewed(analysisProp);
      setAnalysis(analysisProp);
      setUserNotes(analysisProp.user_notes || '');
    } else {
      setAnalysis(null);
    }
  }, [analysisProp]);

  const saveNotes = async () => {
    if (!analysis) return;
    
    setIsSavingNotes(true);
    try {
        await SafetyAnalysis.update(analysis.id, { user_notes: userNotes });
        setAnalysis(prev => ({...prev, user_notes: userNotes}));
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
    } catch (error) {
        console.error("Error saving notes:", error);
        alert("Failed to save notes. Please try again.");
    }
    setIsSavingNotes(false);
  };

  if (!analysis) return null;

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    const doc = new jsPDF();
    let y = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const contentWidth = pageWidth - (margin * 2);

    const checkPage = () => {
      if (y > pageHeight - 40) { // Keep 40 units buffer at the bottom
        doc.addPage();
        y = margin;
      }
    };

    const addText = (text, fontSize = 11, isBold = false, color = [75, 85, 99]) => {
      if ((text === null || text === undefined || String(text).trim() === '') && text !== 0) return;
      
      const cleanText = sanitizeText(String(text));
      
      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      doc.setTextColor(...color);
      
      const lines = doc.splitTextToSize(cleanText, contentWidth);
      
      const lineHeight = fontSize * 0.6; // Approximate line height
      const totalNeeded = lines.length * lineHeight;
      
      if (y + totalNeeded > pageHeight - 40) {
        checkPage();
      }

      for (let i = 0; i < lines.length; i++) {
        doc.text(lines[i], margin, y);
        y += lineHeight;
      }
      y += 5; // Space after text block
    };

    const addClickableLink = (text, url, fontSize = 10) => {
      if (!text || !url) return;
      
      doc.setFontSize(fontSize);
      doc.setTextColor(59, 130, 246); // Blue color for links
      
      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = fontSize * 0.6; // Approximate line height
      const totalNeeded = lines.length * lineHeight + 3; // +3 for spacing

      if (y + totalNeeded > pageHeight - 40) {
          checkPage();
      }
      
      for (let i = 0; i < lines.length; i++) {
        // textWithLink requires x, y, text, options. It doesn't handle wrapping automatically.
        // For simplicity, we apply the link to the first line and display subsequent lines as normal text.
        // A more advanced solution would be to calculate segment by segment.
        if (i === 0) {
            doc.textWithLink(lines[i], margin + 10, y, { url: url });
        } else {
            doc.text(lines[i], margin + 10, y);
        }
        y += lineHeight;
      }
      y += 3; // Small space after link block
    };

    const addTitle = (text, fontSize = 16) => {
      y += 10; // Space before title
      addText(text, fontSize, true, [59, 130, 246]); // Blue color
      // addText already adds 5px, no need for another y += 5; here
    };

    const addBulletPoints = (items) => {
      if (!items || !Array.isArray(items)) return;
      items.forEach(item => {
        const cleanText = sanitizeText(item);
        doc.setFontSize(11);
        doc.setTextColor(75, 85, 99); // gray

        const lineHeight = 11 * 0.6; // Approx. line height for 11pt font
        // Split the item text for wrapping, indenting the wrapped lines
        const lines = doc.splitTextToSize(cleanText, contentWidth - 10); // 10 for bullet indent
        
        const neededSpace = lines.length * lineHeight + 2; // +2 for space after bullet

        if (y + neededSpace > pageHeight - 40) {
            checkPage(); // New page if needed
        }

        // Draw bullet
        doc.text('•', margin, y + (lineHeight / 2)); // Vertically center bullet

        for (let i = 0; i < lines.length; i++) {
          doc.text(lines[i], margin + 10, y); // Indent text
          y += lineHeight;
        }
        y += 2; // Space after this bullet point
      });
      y += 5; // Space after all bullet points
    };

    // Header
    addText(`${analysis.company_name} - EHS/ESG Dossier`, 20, true, [31, 41, 55]); // Dark Gray
    addText(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 10, false, [107, 114, 128]); // Light Gray

    // AI Disclaimer
    if (analysis?.data_source?.includes("AI Generated")) {
      checkPage(); // Ensure space for disclaimer box
      const disclaimerBoxHeight = 25; // Fixed height for disclaimer box
      doc.setFillColor(254, 249, 195); // Light yellow background
      doc.rect(margin, y - 5, contentWidth, disclaimerBoxHeight, 'F');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(146, 64, 14); // Amber-ish color
      doc.text("AI Disclaimer:", margin + 5, y + 2);
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(146, 64, 14); // Amber-ish color
      const disclaimerText = "This dossier was generated by AI and may contain inaccuracies. Always verify critical information from primary sources.";
      const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth - 10);
      doc.text(disclaimerLines, margin + 5, y + 10);
      
      y += disclaimerBoxHeight + 5; // Move Y past the disclaimer box
    }

    // Executive Summary
    if (analysis.executive_summary) {
      addTitle("Executive Summary");
      addText(analysis.executive_summary);
    }

    // Company Profile
    addTitle("Company Profile");
    if (analysis.industry) addText(`Industry: ${analysis.industry}`, 11);
    if (analysis.headquarters_location) addText(`Headquarters: ${analysis.headquarters_location}`, 11);
    if (analysis.employee_count != null) addText(`Employees: ${analysis.employee_count.toLocaleString()}`, 11);
    if (analysis.annual_revenue) addText(`Annual Revenue: $${analysis.annual_revenue.toLocaleString()}`, 11);
    if (analysis.naics_code) addText(`NAICS Code: ${analysis.naics_code}`, 11);
    if (analysis.business_description) addText(`Business Description: ${analysis.business_description}`, 11);
    if (analysis.key_products_services?.length > 0) {
      addText("Key Products & Services:", 11, true);
      addBulletPoints(analysis.key_products_services);
    }

    // Sales Intelligence
    if (analysis.sales_pain_points?.length > 0) {
      addTitle("Sales Pain Points");
      addBulletPoints(analysis.sales_pain_points);
    }

    if (analysis.sales_opportunities?.length > 0) {
        addTitle("Sales Opportunities");
        analysis.sales_opportunities.forEach((opportunity, index) => {
            checkPage();
            addText(`${index + 1}. ${opportunity.opportunity_description}`, 12, true, [31, 41, 55]);
            addText(`Priority: ${opportunity.priority_level}`, 10, false, [107, 114, 128]);
            if (opportunity.suggested_modules && opportunity.suggested_modules.length > 0) {
                addText(`Suggested Modules: ${opportunity.suggested_modules.join(', ')}`, 10);
            }
            if (opportunity.module_use_case) {
                addText(`Use Case: ${opportunity.module_use_case}`, 10);
            }
            if (opportunity.key_features && opportunity.key_features.length > 0) {
                addText("Key Features:", 10, true);
                opportunity.key_features.forEach(feature => addText(`• ${feature}`, 9));
            }
            y += 5;
        });
    }

    if (analysis.sales_talking_points?.length > 0) {
      addTitle("Sales Talking Points");
      addBulletPoints(analysis.sales_talking_points);
    }

    // Partnership Recommendations
    if (analysis.suggested_partnerships?.length > 0) {
      addTitle("Potential Partnership Recommendations");
      analysis.suggested_partnerships.forEach((partner, index) => {
        checkPage();
        addText(`${index + 1}. ${partner.partner_name}`, 12, true, [31, 41, 55]);
        if (partner.status) addText(`Status: ${partner.status}`, 10, false, [107, 114, 128]);
        if (partner.partner_type) addText(`Type: ${partner.partner_type}`, 10, false, [107, 114, 128]);
        if (partner.category) addText(`Category: ${partner.category}`, 10, false, [107, 114, 128]);
        if (partner.relevance_reason) addText(`Why they're a fit: ${partner.relevance_reason}`);
        if (partner.potential_value) addText(`Potential Value: ${partner.potential_value}`);
        if (partner.ehs_insight_enhancement) addText(`How they enhance EHS Insight: ${partner.ehs_insight_enhancement}`);
        y += 5;
      });
    }

    // EHS Performance
    if ((analysis.trir !== null && analysis.trir !== undefined) || analysis.recent_osha_penalties || analysis.common_injury_types?.length > 0 || analysis.notable_incidents?.length > 0 || analysis.regulatory_history?.length > 0) {
        addTitle("EHS Performance");
        if (analysis.trir !== null && analysis.trir !== undefined) addText(`Company TRIR: ${analysis.trir}`, 11, true);
        if (analysis.recent_osha_penalties) addText(`Recent OSHA Penalties: $${analysis.recent_osha_penalties.toLocaleString()}`, 11, true);
        if (analysis.common_injury_types?.length > 0) {
            addText("Common Injury Types:", 11, true);
            addBulletPoints(analysis.common_injury_types);
        }
        if (analysis.notable_incidents?.length > 0) {
            addText("Notable Incidents:", 11, true);
            addBulletPoints(analysis.notable_incidents);
        }
        if (analysis.regulatory_history?.length > 0) {
            addText("Regulatory History:", 11, true);
            addBulletPoints(analysis.regulatory_history);
        }
    }

    // Safety Pays Calculation
    if (analysis.safety_pays_calculation) {
      const calc = analysis.safety_pays_calculation;
      addTitle("Safety Pays Calculation");
      addText(`Direct Costs: $${calc.total_direct_costs?.toLocaleString()}`, 11);
      addText(`Indirect Costs: $${calc.total_indirect_costs?.toLocaleString()}`, 11);
      addText(`Combined Total: $${calc.combined_total_cost?.toLocaleString()}`, 11, true);
      addText(`Sales Needed to Cover: $${calc.sales_needed_to_cover?.toLocaleString()}`, 11, true);
      if (calc.selected_injuries_breakdown && calc.selected_injuries_breakdown.length > 0) {
          addText("Injury Cost Breakdown:", 11, true);
          calc.selected_injuries_breakdown.forEach(injury => {
              addText(`• ${injury.label}: Count ${injury.count}, Total Cost $${injury.total_cost?.toLocaleString()}`, 10);
          });
      }
    }

    // Environmental & Sustainability Profile
    if (analysis.applicable_environmental_programs || analysis.environmental_programs?.length > 0) {
        addTitle("Environmental & Sustainability Profile");
        if (analysis.applicable_environmental_programs) {
            addText("Applicable Regulatory Landscape:", 11, true);
            addText(analysis.applicable_environmental_programs, 10); // Assuming this is a text block
        }
        if (analysis.environmental_programs?.length > 0) {
            addText("AI-Identified Environmental & Sustainability Programs:", 11, true);
            addBulletPoints(analysis.environmental_programs);
        }
    }

    // ESG Profile
    if (analysis.social_programs?.length > 0 || analysis.governance_practices?.length > 0 || analysis.sustainability_goals?.length > 0) {
        addTitle("ESG Profile");
        if (analysis.social_programs?.length > 0) {
            addText("Social Programs:", 11, true);
            addBulletPoints(analysis.social_programs);
        }
        if (analysis.governance_practices?.length > 0) {
            addText("Governance Practices:", 11, true);
            addBulletPoints(analysis.governance_practices);
        }
        if (analysis.sustainability_goals?.length > 0) {
            addText("Sustainability Goals:", 11, true);
            addBulletPoints(analysis.sustainability_goals);
        }
    }

    // Canadian Safety Information
    if (analysis.canada_safety_information) {
        const canadaInfo = analysis.canada_safety_information;
        addTitle("Canadian Safety Information");
        
        if (canadaInfo.federal_regulations_overview) {
            addText("Federal Regulations Overview:", 11, true);
            addText(canadaInfo.federal_regulations_overview);
        }
        
        if (canadaInfo.provincial_regulations && canadaInfo.provincial_regulations.length > 0) {
            addText("Provincial Regulations:", 11, true);
            canadaInfo.provincial_regulations.forEach((prov) => {
                addText(`• ${prov.province}: ${prov.regulation_summary}`, 10);
            });
        }
        
        if (canadaInfo.canadian_incidents_penalties && canadaInfo.canadian_incidents_penalties.length > 0) {
            addText("Canadian Incidents & Penalties:", 11, true);
            addBulletPoints(canadaInfo.canadian_incidents_penalties);
        }
        
        if (canadaInfo.regulatory_bodies && canadaInfo.regulatory_bodies.length > 0) {
            addText("Relevant Canadian Regulatory Bodies:", 11, true);
            addBulletPoints(canadaInfo.regulatory_bodies);
        }
        
        if (canadaInfo.canadian_sources && canadaInfo.canadian_sources.length > 0) {
            addText("Canadian Sources Referenced:", 11, true);
            canadaInfo.canadian_sources.forEach(source => {
                if (typeof source === 'string') {
                    // Check for markdown format and format it for PDF, otherwise use as-is
                    const markdownMatch = source.match(/\[([^\]]+)\]\(([^)]+)\)/);
                    if (markdownMatch) {
                        addClickableLink(`• ${markdownMatch[1]}`, markdownMatch[2]);
                    } else if (source.trim().startsWith('http://') || source.trim().startsWith('https://')) {
                        addClickableLink(`• ${source}`, source);
                    } else if (source.match(/^\[(.*?)\]$/)) {
                        const searchMatch = source.match(/^\[(.*?)\]$/);
                        const query = encodeURIComponent(searchMatch[1]);
                        addClickableLink(`• ${searchMatch[1]} (Google Search)`, `https://www.google.com/search?q=${query}`);
                    } else {
                        addText(`• ${source}`, 10);
                    }
                }
            });
        }
    }

    // Awards & Recognitions
    if (analysis.esg_awards_recognitions?.length > 0 || analysis.esg_ratings?.length > 0) {
        addTitle("Awards & Recognitions");
        if (analysis.esg_awards_recognitions?.length > 0) {
            addText("Awards & Recognition:", 11, true);
            addBulletPoints(analysis.esg_awards_recognitions);
        }
        if (analysis.esg_ratings?.length > 0) {
            addText("ESG Ratings:", 11, true);
            addBulletPoints(analysis.esg_ratings);
        }
    }

    // Regulatory searches
    if (analysis.regulatory_search_links && analysis.regulatory_search_links.length > 0) {
        addTitle("Saved Regulatory Searches");
        analysis.regulatory_search_links.forEach((link) => {
            addText(`${link.title}`, 11, true);
            addText(`Database: ${link.database}`, 10);
            addClickableLink(`URL: ${link.url}`, link.url);
        });
    }

    // Personal Notes
    if (userNotes && userNotes.trim()) {
        addTitle("Personal Notes");
        addText(userNotes);
    }

    // AI Recommendations
    if (analysis.recommendations?.length > 0) {
      addTitle("AI Recommendations");
      addBulletPoints(analysis.recommendations);
    }

    // Sources
    if (analysis.sources_referenced && analysis.sources_referenced.length > 0) {
      addTitle("Sources Referenced");
      analysis.sources_referenced.forEach(source => {
        if (typeof source === 'string' && source.trim() !== '' && !source.toLowerCase().includes('turnosearch')) {
          checkPage();
          
          // Handle markdown links like [Text](url)
          const markdownMatch = source.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (markdownMatch) {
            addClickableLink(`• ${markdownMatch[1]}`, markdownMatch[2]);
          }
          // Handle raw URLs
          else if (source.trim().startsWith('http://') || source.trim().startsWith('https://')) {
            addClickableLink(`• ${source}`, source);
          }
          // Handle search queries like [Text]
          else if (source.match(/^\[(.*?)\]$/)) {
            const searchMatch = source.match(/^\[(.*?)\]$/);
            const query = encodeURIComponent(searchMatch[1]);
            addClickableLink(`• ${searchMatch[1]} (Google Search)`, `https://www.google.com/search?q=${query}`);
          }
          // Regular text
          else {
            addText(`• ${source}`, 10);
          }
        }
      });
    } else {
      addTitle("Sources Referenced");
      addText("No specific sources were cited in this AI-generated analysis.", 10, false, [107, 114, 128]);
    }

    doc.save(`${analysis.company_name?.replace(/\s/g, '_') || 'Company'}_Dossier.pdf`);
    logPDFDownloaded(analysis);
    setIsDownloading(false);
  };

  const isAiGenerated = analysis?.data_source?.includes("AI Generated");

  return (
    <>
      <Dialog open={!!analysis} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-6xl w-[95vw] max-w-[95vw] sm:w-full max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-4 h-4 sm:w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-lg sm:text-2xl font-bold text-slate-900 block truncate">{analysis.company_name}</span>
                <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs">{analysis.industry}</Badge>
                    {analysis.company_size &&
                  <Badge variant="secondary" className="text-xs">
                        {analysis.company_size}
                      </Badge>
                  }
                  {isAiGenerated &&
                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                      AI Dossier
                    </Badge>
                  }
                </div>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 overflow-y-auto flex-grow pr-2 sm:pr-6 -mr-2 sm:-mr-6">
            {isAiGenerated &&
            <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-900">
                <AlertTriangle className="h-4 w-4 !text-amber-600" />
                <AlertTitle className="font-semibold">AI-Powered Analysis Disclaimer</AlertTitle>
                <AlertDescription>
                  This dossier was generated by an AI and may contain inaccuracies. Always verify critical information from primary sources.
                </AlertDescription>
              </Alert>
            }
            
            {isAiGenerated ? (
              <>
                {/* Executive Summary */}
                {analysis.executive_summary &&
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                    <h3 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-primary-600" />
                      Executive Summary
                    </h3>
                    <p className="text-slate-700">{sanitizeText(analysis.executive_summary)}</p>
                  </div>
              }

                {/* Company Profile */}
                <CollapsibleSection title="Company Profile" icon={Building2}>
                  <CompanyProfileSection analysis={analysis} />
                </CollapsibleSection>

                {/* Industry Trends & Peer Comparisons */}
                {analysis.industry_trends && analysis.industry_trends.length > 0 &&
                  <CollapsibleSection title="Industry Trends & Peer Comparisons" icon={TrendingUp} defaultOpen={true}>
                    <p className="text-sm text-slate-600 mb-4">The following are common EHS challenges and trends for companies in the <strong>{analysis.industry}</strong> sector:</p>
                    <BulletedList items={analysis.industry_trends} bulletClass="bg-cyan-500" />
                  </CollapsibleSection>
                }
                
                {/* EHS Performance */}
                <CollapsibleSection title="EHS Performance" icon={Shield} defaultOpen={true}>
                  <EHSPerformanceSection analysis={analysis} />
                </CollapsibleSection>

                {/* Safety Pays Calculation */}
                {analysis.safety_pays_calculation &&
              <CollapsibleSection title="Safety Pays Calculation" icon={DollarSign} defaultOpen={true}>
                    <SafetyPaysSection analysis={analysis} />
                  </CollapsibleSection>
              }

                {/* Environmental & Sustainability Profile */}
                <CollapsibleSection title="Environmental & Sustainability Profile" icon={Leaf}>
                  <EnvironmentalSummarySection analysis={analysis} />
                </CollapsibleSection>

                {/* ESG Profile */}
                <CollapsibleSection title="ESG Profile" icon={Users}>
                  <ESGSection analysis={analysis} />
                </CollapsibleSection>

                {/* Canadian Safety Information */}
                {analysis.canada_safety_information && (
                    <CollapsibleSection title="🇨🇦 Canadian Safety Information" icon={Shield} defaultOpen={true}>
                        <CanadianSafetySection analysis={analysis} />
                    </CollapsibleSection>
                )}

                {/* Sales Intelligence Section - NEW */}
                <CollapsibleSection title="🎯 Sales Intelligence" icon={Target} defaultOpen={true}>
                  <div className="space-y-6">
                    {/* Sales Pain Points */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        💔 Sales Pain Points
                      </h4>
                      {analysis.sales_pain_points && analysis.sales_pain_points.length > 0 ? (
                        <BulletedList items={analysis.sales_pain_points} bulletClass="bg-red-500" />
                      ) : (
                        <p className="text-slate-500 italic">No sales pain points identified.</p>
                      )}
                    </div>

                    {/* Sales Opportunities */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        ✨ Sales Opportunities
                      </h4>
                      {analysis.sales_opportunities && analysis.sales_opportunities.length > 0 ? (
                        <div className="space-y-4">
                          {analysis.sales_opportunities.map((opportunity, index) => (
                            <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                                <h5 className="font-medium text-blue-900">{opportunity.opportunity_description}</h5>
                                <Badge className={
                                  opportunity.priority_level === 'High' ? 'bg-red-100 text-red-800' :
                                  opportunity.priority_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }>
                                  {opportunity.priority_level} Priority
                                </Badge>
                              </div>
                              {opportunity.suggested_modules && opportunity.suggested_modules.length > 0 && (
                                <div className="mb-2">
                                  <strong className="text-sm text-blue-800">Suggested Modules:</strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {opportunity.suggested_modules.map((module, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {module}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {opportunity.module_use_case && (
                                <p className="text-sm text-blue-800 mb-2">
                                  <strong>Use Case:</strong> {opportunity.module_use_case}
                                </p>
                              )}
                              {opportunity.key_features && opportunity.key_features.length > 0 && (
                                <div>
                                  <strong className="text-sm text-blue-800">Key Features:</strong>
                                  <ul className="list-disc pl-5 text-sm text-blue-700 mt-1">
                                    {opportunity.key_features.map((feature, idx) => (
                                      <li key={idx}>{feature}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 italic">No sales opportunities identified.</p>
                      )}
                    </div>

                    {/* Sales Talking Points */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                        🗣️ Sales Talking Points
                      </h4>
                      {analysis.sales_talking_points && analysis.sales_talking_points.length > 0 ? (
                        <ul className="list-decimal pl-5 space-y-2 text-slate-700">
                          {analysis.sales_talking_points.map((point, i) => (
                            <li key={i} className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                              {sanitizeText(point)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-slate-500 italic">No sales talking points generated.</p>
                      )}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* Saved Regulatory Searches */}
                {analysis.regulatory_search_links && analysis.regulatory_search_links.length > 0 && (
                    <CollapsibleSection title="Saved Regulatory Searches" icon={FileSearch} defaultOpen={true}>
                        <RegulatoryLinksSection links={analysis.regulatory_search_links} />
                    </CollapsibleSection>
                )}

                {/* Potential Partnership Recommendations - NEW */}
                {analysis.suggested_partnerships && analysis.suggested_partnerships.length > 0 && (
                  <CollapsibleSection title="Potential Partnership Recommendations" icon={Handshake} defaultOpen={true}>
                    <div className="space-y-4">
                      <p className="text-sm text-slate-600 mb-4">
                        Based on this client's profile and EHS challenges, the following partnerships could enhance EHS Insight's solution offerings:
                      </p>
                      {analysis.suggested_partnerships.map((partner, i) => (
                        <div key={i} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                            <h5 className="font-semibold text-purple-900">{sanitizeText(partner.partner_name)}</h5>
                            <div className="flex gap-2 flex-shrink-0">
                              {partner.status && (
                                <Badge className={
                                  partner.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' :
                                  'bg-blue-100 text-blue-800'
                                }>
                                  {sanitizeText(partner.status)}
                                </Badge>
                              )}
                              {partner.partner_type && <Badge variant="secondary" className="bg-purple-100 text-purple-800">{sanitizeText(partner.partner_type)}</Badge>}
                              {partner.category && <Badge variant="secondary" className="bg-purple-100 text-purple-800">{sanitizeText(partner.category)}</Badge>}
                            </div>
                          </div>
                          
                          <p className="text-sm text-purple-800 mb-2">
                            <strong className="font-medium">Why they're a fit:</strong> {sanitizeText(partner.relevance_reason)}
                          </p>
                          
                          {partner.potential_value && (
                            <p className="text-sm text-purple-800 mb-2">
                              <strong className="font-medium">Potential Value:</strong> {sanitizeText(partner.potential_value)}
                            </p>
                          )}
                          
                          {partner.ehs_insight_enhancement && (
                            <p className="text-sm text-purple-800">
                              <strong className="font-medium">How they enhance EHS Insight:</strong> {sanitizeText(partner.ehs_insight_enhancement)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}
                
                {/* Sales Case Study Generator */}
                <CaseStudyGenerator analysis={analysis} />

                {/* Personal Notes Section - NEW */}
                <CollapsibleSection title="Personal Notes" icon={Edit3} defaultOpen={true}>
                    <div className="space-y-4">
                        <Textarea
                            placeholder="Add your personal notes about this client, meeting details, follow-up actions, etc..."
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            className="min-h-32 resize-y bg-white"
                        />
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                                Notes are automatically saved.
                            </p>
                            <Button 
                                onClick={saveNotes}
                                disabled={isSavingNotes}
                                className="flex items-center gap-2"
                            >
                                {isSavingNotes ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : notesSaved ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {notesSaved ? 'Saved!' : 'Save Notes'}
                            </Button>
                        </div>
                    </div>
                </CollapsibleSection>

                {/* Awards & Recognition - Always show this section */}
                <CollapsibleSection title="Awards & Recognition" icon={Award}>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3">Awards & Recognition</h4>
                      {analysis.esg_awards_recognitions && analysis.esg_awards_recognitions.length > 0 ? (
                        <BulletedList items={analysis.esg_awards_recognitions} bulletClass="bg-amber-500" />
                      ) : (
                        <p className="text-slate-500 italic">No awards or recognitions found.</p>
                      )}
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-3">ESG Ratings</h4>
                      {analysis.esg_ratings && analysis.esg_ratings.length > 0 ? (
                        <BulletedList items={analysis.esg_ratings} bulletClass="bg-green-500" />
                      ) : (
                        <p className="text-slate-500 italic">No ESG ratings found.</p>
                      )}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* AI Recommendations - Always show this section */}
                <CollapsibleSection title="AI Recommendations" icon={FileText} defaultOpen={true}>
                  {analysis.recommendations && analysis.recommendations.length > 0 ? (
                    <ul className="list-decimal pl-5 space-y-2 text-slate-700">
                      {analysis.recommendations.map((rec, i) => (
                        <li key={i}>{sanitizeText(rec)}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic">No AI recommendations generated.</p>
                  )}
                </CollapsibleSection>

                {/* Sources Referenced - Always show this section */}
                <CollapsibleSection title="Sources Referenced" icon={FileText} defaultOpen={true}>
                  {analysis.sources_referenced && analysis.sources_referenced.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600">
                      {analysis.sources_referenced.map((source, i) => (
                        <li key={i}><SourceLink source={source} /></li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic">No specific sources were cited in this analysis.</p>
                  )}
                </CollapsibleSection>
              </>
            ) : (
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                <h3 className="font-semibold">Manual Data Entry</h3>
                <p>This analysis was created manually. No detailed AI-generated report is available.</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-4 border-t border-slate-200 flex-shrink-0">
             <div className="flex flex-col sm:flex-row justify-end gap-2 w-full">
                {isAiGenerated &&
              <>
                    <Link to={createPageUrl("ClientDossier") + "?id=" + analysis.id}>
                      <Button variant="outline" className="bg-yellow-300 px-4 py-2 text-sm font-medium justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:-outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 flex items-center gap-2 w-full sm:w-auto">
                        <Users className="w-4 h-4" />
                        <span className="sm:inline">Client Dossier</span>
                      </Button>
                    </Link>
                    <Link to={createPageUrl('RegulatorySearch') + `?companyName=${encodeURIComponent(analysis.company_name || '')}`}>
                        <Button variant="outline" className="bg-[#0307fc] text-[#ffffff] px-4 py-2 text-sm font-medium justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:bg-accent hover:text-accent-foreground h-10 flex items-center gap-2 w-full sm:w-auto">
                            <Search className="w-4 h-4" />
                            Go to Regulatory Search
                        </Button>
                    </Link>
                    <Link to={createPageUrl('Calculators') + `?dossier=${analysis.id}&tab=safety-pays`}>
                        <Button variant="outline" className="bg-pink-500 text-[#ffffff] px-4 py-2 text-sm font-medium justify-center whitespace-nowrap rounded-md ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input hover:text-accent-foreground h-10 hover:bg-green-700 flex items-center gap-2 w-full sm:w-auto">
                            <DollarSign className="w-4 h-4" />
                            Safety Pays Calculator
                        </Button>
                    </Link>
                    <Button onClick={handleDownloadPdf} disabled={isDownloading} className="flex items-center gap-2 w-full sm:w-auto">
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                      <span className="sm:inline">Download PDF</span>
                    </Button>
                  </>
              }
             </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
