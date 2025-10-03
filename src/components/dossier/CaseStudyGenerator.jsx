import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Wand2, Loader2, Copy, Download } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import { logCaseStudyGenerated, logCaseStudyDownloaded } from '@/components/utils/analytics';

export default function CaseStudyGenerator({ analysis }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaseStudy, setGeneratedCaseStudy] = useState("");
  const [showEditor, setShowEditor] = useState(false);

  const handleGenerateCaseStudy = async () => {
    setIsGenerating(true);
    
    try {
      const prompt = `
        You are a sales enablement expert for EHS Insight, a leading EHS software company. Your task is to generate a compelling, client-facing case study for a salesperson to use when talking to "${analysis.company_name}".

        The case study should be a short, impactful narrative that highlights the financial and operational benefits of implementing EHS Insight's software. It should be based on the provided company data but presented as a success story of a *similar* (but fictional) company to avoid making direct claims about ${analysis.company_name}.

        **Client Data Provided:**
        - Company Name: ${analysis.company_name}
        - Industry: ${analysis.industry || 'Not specified'}
        - Employee Count: ${analysis.employee_count?.toLocaleString() || 'N/A'}
        - Annual Revenue: ${analysis.annual_revenue ? `$${analysis.annual_revenue.toLocaleString()}` : 'N/A'}
        - Key Pain Points Identified: ${(analysis.sales_pain_points || []).join(', ') || 'General safety management inefficiencies'}
        - Key Opportunities Identified: ${(analysis.sales_opportunities || []).map(o => typeof o === 'object' ? o.opportunity_description : o).join(', ') || 'Improving safety culture and reducing incident costs'}
        - Safety Pays Calculation (if available): ${analysis.safety_pays_calculation ? `Total cost of recent injuries estimated at $${analysis.safety_pays_calculation.combined_total_cost?.toLocaleString()}` : 'Not calculated'}

        **Instructions for Case Study Generation:**

        1.  **Fictional Company Name:** Create a realistic but fictional name for a company in the same industry. Do not use "${analysis.company_name}". For example, if the client is "Acme Inc.", you could use a name like "Pinnacle Manufacturing" or "Summit Logistics".
        2.  **Narrative Structure:** Follow a classic problem-solution-result structure.
            *   **The Challenge (Problem):** Describe the struggles the fictional company faced. Use the client's pain points and data to make this realistic. Mention specific, quantifiable problems. **CRITICAL: If you are using a number that is an estimate and not from the provided client data, you MUST preface it with "an estimated", "approximately", or a similar qualifying phrase.** For example, instead of "20 workplace accidents", write "an estimated 20 workplace accidents annually, leading to over $250,000 in direct and indirect costs...".
            *   **The Solution:** Explain how the company implemented EHS Insight's software. Mention 1-3 specific modules from the list below that directly address the problems.
            *   **The Results:** Detail the impressive, quantifiable outcomes. This is the most important part. Use compelling metrics like "25% reduction in TRIR," "50% faster incident reporting," or "$150,000 saved in the first year."
        3.  **Quantify Everything:** Use numbers and percentages to make the results tangible and powerful. Base these on the provided client data and industry standards.
        4.  **EHS Insight Modules:** Select relevant modules from this list: Incident Management, Audits & Inspections, Training Management, Compliance Management, Environmental Management, Risk Assessment.
        5.  **Tone:** The tone should be professional, confident, and benefit-oriented. It's a sales tool.

        **Output Format:**
        The output must be a single block of Markdown text. Use headings for "The Challenge," "The Solution," and "The Results." Use bullet points for key results.
        `;

      const response = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedCaseStudy(response);
      setShowEditor(true);

      // Log case study generation
      logCaseStudyGenerated(analysis.company_name, "Sales Case Study");
            
    } catch (error) {
      console.error("Error generating case study:", error);
      alert(`Error generating case study: ${error.message}`);
    }
    
    setIsGenerating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCaseStudy);
    alert("Case study copied to clipboard!");
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 20;
    const pageMargin = 20;
    const pageHeight = doc.internal.pageSize.height;
    const effectiveWidth = doc.internal.pageSize.width - (pageMargin * 2);

    // Colors
    const colors = {
      primary: [14, 165, 233],
      slate900: [15, 23, 42],
      slate700: [51, 65, 85],
      slate600: [71, 85, 105],
    };

    const checkPageBreak = (spaceNeeded) => {
      if (y + spaceNeeded > pageHeight - pageMargin) {
        doc.addPage();
        y = pageMargin;
      }
    };

    const addTitle = (text, level = 1) => {
      let fontSize = level === 1 ? 18 : level === 2 ? 16 : 14;
      let textColor = level === 1 ? colors.primary : colors.slate700;
      
      checkPageBreak(fontSize + 10);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(...textColor);
      doc.text(text, pageMargin, y);
      y += fontSize / 2 + 8;
      
      if (level === 1) {
        doc.setDrawColor(...colors.primary);
        doc.setLineWidth(1);
        doc.line(pageMargin, y - 5, pageMargin + effectiveWidth, y - 5);
        y += 5;
      }
      
      doc.setFont(undefined, 'normal');
      doc.setTextColor(...colors.slate600);
    };

    const addParagraph = (text) => {
      if (!text) return;
      doc.setFontSize(11);
      doc.setTextColor(...colors.slate600);
      const lines = doc.splitTextToSize(text, effectiveWidth);
      checkPageBreak(lines.length * 5 + 5);
      doc.text(lines, pageMargin, y);
      y += lines.length * 5 + 10;
    };

    // Parse markdown-like content and format it properly
    const parseAndRenderContent = (content) => {
      const lines = content.split('\n');
      
      for (let line of lines) {
        line = line.trim();
        if (!line) continue;
        
        // Handle headers (##, ###, etc.)
        if (line.startsWith('###')) {
          addTitle(line.replace(/^#+\s*/, '').replace(/\*\*/g, ''), 3);
        } else if (line.startsWith('##')) {
          addTitle(line.replace(/^#+\s*/, '').replace(/\*\*/g, ''), 2);
        } else if (line.startsWith('#')) {
          addTitle(line.replace(/^#+\s*/, '').replace(/\*\*/g, ''), 1);
        } else if (line.startsWith('**') && line.endsWith('**')) {
          // Bold standalone line
          checkPageBreak(15);
          doc.setFont(undefined, 'bold');
          doc.setFontSize(12);
          doc.setTextColor(...colors.slate700);
          doc.text(line.replace(/\*\*/g, ''), pageMargin, y);
          y += 15;
          doc.setFont(undefined, 'normal');
        } else if (line.startsWith('- ')) {
          // Bullet point
          checkPageBreak(12);
          doc.setFontSize(11);
          doc.setTextColor(...colors.slate600);
          const bulletText = line.replace(/^- /, '');
          const lines = doc.splitTextToSize(bulletText, effectiveWidth - 15);
          
          // Draw bullet
          doc.setFillColor(...colors.primary);
          doc.circle(pageMargin + 5, y + 2, 1.5, 'F');
          
          // Add text
          doc.text(lines, pageMargin + 10, y);
          y += lines.length * 5 + 5;
        } else {
          // Regular paragraph
          addParagraph(line.replace(/\*\*/g, ''));
        }
      }
    };

    // Title page
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...colors.slate900);
    doc.text(`Sales Case Study`, doc.internal.pageSize.width / 2, y, { align: 'center' });
    y += 20;
    
    doc.setFontSize(18);
    doc.setTextColor(...colors.primary);
    doc.text(`${analysis.company_name}`, doc.internal.pageSize.width / 2, y, { align: 'center' });
    y += 15;
    
    doc.setFontSize(12);
    doc.setTextColor(...colors.slate600);
    doc.text(`EHS Insight Solutions - ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width / 2, y, { align: 'center' });
    y += 30;

    // Parse and render the case study content
    parseAndRenderContent(generatedCaseStudy);

    // Save the PDF
    doc.save(`${analysis.company_name?.replace(/\s+/g, '_')}_Sales_Case_Study.pdf`);

    // Log the download
    logCaseStudyDownloaded(analysis.company_name, "Sales Case Study", 'PDF');
  };

  const handleDownloadWord = () => {
    let htmlBodyContent = '';
    const lines = generatedCaseStudy.split('\n');
    let inList = false;

    lines.forEach(line => {
        let processedLine = line.trim();
        if (!processedLine) return;

        // Convert bold within the line
        processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        if (processedLine.startsWith('###')) {
            if (inList) { htmlBodyContent += '</ul>'; inList = false; }
            htmlBodyContent += `<h3>${processedLine.substring(3).trim()}</h3>`;
        } else if (processedLine.startsWith('##')) {
            if (inList) { htmlBodyContent += '</ul>'; inList = false; }
            htmlBodyContent += `<h2>${processedLine.substring(2).trim()}</h2>`;
        } else if (processedLine.startsWith('#')) {
            if (inList) { htmlBodyContent += '</ul>'; inList = false; }
            htmlBodyContent += `<h1>${processedLine.substring(1).trim()}</h1>`;
        } else if (processedLine.startsWith('- ')) {
            if (!inList) { htmlBodyContent += '<ul>'; inList = true; }
            htmlBodyContent += `<li>${processedLine.substring(2).trim()}</li>`;
        } else {
            if (inList) { htmlBodyContent += '</ul>'; inList = false; }
            htmlBodyContent += `<p>${processedLine}</p>`;
        }
    });
    if (inList) { // Close any open list at the end
        htmlBodyContent += '</ul>';
    }

    // Create a proper HTML document that can be opened in Word
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Sales Case Study - ${analysis.company_name}</title>
    <style>
        body { 
            font-family: 'Calibri', Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px;
            color: #333;
        }
        h1 { 
            color: #0ea5e9; 
            border-bottom: 2px solid #0ea5e9; 
            padding-bottom: 10px;
            font-size: 24px;
        }
        h2 { 
            color: #334155; 
            margin-top: 30px;
            font-size: 20px;
        }
        h3 { 
            color: #475569; 
            margin-top: 25px;
            font-size: 16px;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 30px;
        }
        .company-name {
            font-size: 28px;
            color: #0ea5e9;
            font-weight: bold;
            margin: 10px 0;
        }
        .subtitle {
            color: #64748b;
            font-size: 14px;
        }
        ul {
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        p {
            margin-bottom: 15px;
        }
        .highlight {
            background-color: #f1f5f9;
            padding: 15px;
            border-left: 4px solid #0ea5e9;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Sales Case Study</h1>
        <div class="company-name">${analysis.company_name}</div>
        <div class="subtitle">EHS Insight Solutions - ${new Date().toLocaleDateString()}</div>
    </div>
    ${htmlBodyContent}
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${analysis.company_name?.replace(/\s+/g, '_')}_Sales_Case_Study.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Log the download
    logCaseStudyDownloaded(analysis.company_name, "Sales Case Study", 'Word');
  };

  if (!showEditor && !generatedCaseStudy) {
    return (
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Generate Sales Case Study
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">What this generates:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>A compelling case study about a fictional similar company.</li>
              <li>Highlights key pain points and strategic opportunities.</li>
              <li>Recommends specific EHS Insight modules.</li>
              <li>Formatted for easy export to PDF or Word.</li>
            </ul>
          </div>
          
          <Button
            onClick={handleGenerateCaseStudy}
            disabled={isGenerating}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating Case Study...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-2" />
                Generate Sales Case Study
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border-slate-200">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Sales Case Study for {analysis.company_name}
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadWord}>
              <Download className="w-4 h-4 mr-2" />
              Word
            </Button>
            <Button variant="destructive" size="sm" onClick={() => {
              setGeneratedCaseStudy("");
              setShowEditor(false);
            }}>
              Generate New
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Case Study Content (Editable)
            </label>
            <Textarea
              value={generatedCaseStudy}
              onChange={(e) => setGeneratedCaseStudy(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
              placeholder="Generated case study will appear here..."
            />
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-semibold text-slate-800 mb-3">Preview:</h4>
            <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg border">
              <ReactMarkdown>{generatedCaseStudy}</ReactMarkdown>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}