
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Wand2 } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';
import { SafetyAnalysis } from '@/api/entities';
import { logDossierGenerated } from '@/components/utils/analytics';

const buildReportText = (analysis) => {
    let report = `# ${analysis.company_name} - Safety Analysis Report\n\n`;

    if (analysis.executive_summary) {
        report += `## Executive Summary\n${analysis.executive_summary}\n\n`;
    }

    report += `## Company Profile\n`;
    report += `**Industry:** ${analysis.industry || 'N/A'}\n`;
    if (analysis.naics_code) report += `**NAICS Code:** ${analysis.naics_code}\n`;
    if (analysis.headquarters_location) report += `**Headquarters:** ${analysis.headquarters_location}\n`;
    if (analysis.employee_count) report += `**Employees:** ${analysis.employee_count.toLocaleString()}\n`;
    if (analysis.annual_revenue) report += `**Annual Revenue:** $${analysis.annual_revenue.toLocaleString()}\n`;
    if (analysis.business_description) report += `\n${analysis.business_description}\n`;
    report += `\n`;

    const addSection = (title, content) => {
        // Ensure content is not null/undefined and if it's an array, it's not empty
        if (content && (!Array.isArray(content) || (Array.isArray(content) && content.length > 0))) {
            report += `### **${title}**\n`;
            if (Array.isArray(content)) {
                report += content.map(item => `- ${item}`).join('\n');
            } else {
                report += content;
            }
            report += '\n\n---\n';
        }
    };

    // EHS Performance Profile - significantly updated based on new prompt/schema
    let ehsContent = '';
    if (analysis.recent_osha_penalties !== undefined && analysis.recent_osha_penalties !== null) ehsContent += `- **Recent OSHA Penalties:** ${analysis.recent_osha_penalties ? `$${analysis.recent_osha_penalties.toLocaleString()}` : 'N/A'}\n`;

    if ((analysis.common_injury_types || []).length > 0) ehsContent += `**Common Injury Types:**\n${(analysis.common_injury_types || []).map(i => `  - ${i}`).join('\n')}\n`; else if (ehsContent) ehsContent += `**Common Injury Types:** N/A\n`;
    if ((analysis.notable_incidents || []).length > 0) ehsContent += `**Notable Incidents:**\n${(analysis.notable_incidents || []).map(i => `  - ${i}`).join('\n')}\n`; else if (ehsContent) ehsContent += `**Notable Incidents:** N/A\n`;
    if ((analysis.regulatory_history || []).length > 0) ehsContent += `**Regulatory History (OSHA):**\n${(analysis.regulatory_history || []).map(i => `  - ${i}`).join('\n')}\n`; else if (ehsContent) ehsContent += `**Regulatory History (OSHA): N/A**\n`;

    if (ehsContent.trim().length > 0) {
        addSection('📊 EHS Performance Profile', ehsContent.trim());
    }

    // Applicable Environmental Programs (New Section)
    if (analysis.applicable_environmental_programs) {
        let envProgramsContent = '';
        const programs = Object.entries(analysis.applicable_environmental_programs)
            .filter(([, value]) => value === true)
            .map(([key]) => `- ${key.replace(/_/g, ' ')}`);
        if (programs.length > 0) {
            envProgramsContent += programs.join('\n');
        } else {
            envProgramsContent += 'No specific major environmental regulatory programs identified as broadly applicable or relevant.';
        }
        addSection('🌍 Applicable Environmental Programs', envProgramsContent.trim());
    }

    // Canadian Safety Information section (new)
    if (analysis.canada_safety_information) {
        let canadaSafetyContent = '';
        const cs = analysis.canada_safety_information;

        if (cs.federal_regulations_overview) {
            canadaSafetyContent += `**Federal Regulations Overview:**\n${cs.federal_regulations_overview}\n\n`;
        }

        if (cs.provincial_regulations && cs.provincial_regulations.length > 0) {
            canadaSafetyContent += `**Provincial Regulations:**\n`;
            cs.provincial_regulations.forEach(prov => {
                canadaSafetyContent += `- **${prov.province || 'N/A'}:** ${prov.regulation_summary || 'N/A'}\n`;
            });
            canadaSafetyContent += '\n';
        }

        if (cs.canadian_incidents_penalties && cs.canadian_incidents_penalties.length > 0) {
            canadaSafetyContent += `**Canadian Incidents & Penalties:**\n${cs.canadian_incidents_penalties.map(item => `- ${item}`).join('\n')}\n\n`;
        }

        if (cs.regulatory_bodies && cs.regulatory_bodies.length > 0) {
            canadaSafetyContent += `**Relevant Regulatory Bodies:**\n${cs.regulatory_bodies.map(item => `- ${item}`).join('\n')}\n\n`;
        }

        if (cs.canadian_sources && cs.canadian_sources.length > 0) {
            canadaSafetyContent += `**Canadian Sources:**\n${cs.canadian_sources.map(item => `- ${item}`).join('\n')}\n\n`;
        }

        if (canadaSafetyContent.trim().length > 0) {
            addSection('🇨🇦 Canadian Safety Information', canadaSafetyContent.trim());
        }
    }


    addSection('🌱 Environmental & Sustainability Programs', analysis.environmental_programs);
    addSection('🎯 Sustainability Goals', analysis.sustainability_goals);
    addSection('🤝 Social Responsibility', analysis.social_programs);
    addSection('🏛️ Corporate Governance', analysis.governance_practices);
    addSection('🏆 Awards & Recognition', analysis.esg_awards_recognitions);
    addSection('⭐ ESG Ratings', analysis.esg_ratings);

    // NEW: Industry Trends
    addSection('📈 Industry Trends & Peer Comparisons', analysis.industry_trends);

    if (analysis.profit_margin_percentage !== undefined && analysis.profit_margin_percentage !== null || analysis.cash_flow_indicators) {
        let financialContent = '';
        if (analysis.profit_margin_percentage !== undefined && analysis.profit_margin_percentage !== null) {
            financialContent += `- **Profit Margin:** ${analysis.profit_margin_percentage}%\n`;
        }
        if (analysis.cash_flow_indicators) {
            financialContent += `- **Cash Flow Indicators:** ${analysis.cash_flow_indicators}\n`;
        }
        addSection('💰 Financial Health & Indicators', financialContent.trim());
    }

    addSection('⚠️ Risk Factors & Challenges', analysis.financial_risk_factors);

    if (analysis.sales_pain_points && analysis.sales_pain_points.length > 0) {
        report += `## 💔 Sales Pain Points\n`;
        analysis.sales_pain_points.forEach((point, index) => {
            report += `${index + 1}. ${point}\n`;
        });
        report += `\n`;
    }

    if (analysis.sales_opportunities && analysis.sales_opportunities.length > 0) {
        report += `## ✨ Sales Opportunities\n`;
        analysis.sales_opportunities.forEach((opportunity, index) => {
            report += `${index + 1}. **${opportunity.opportunity_description}** (Priority: ${opportunity.priority_level})\n`;
            if (opportunity.suggested_modules && opportunity.suggested_modules.length > 0) {
                report += `   - **Suggested Modules:** ${opportunity.suggested_modules.join(', ')}\n`;
            }
            if (opportunity.module_use_case) {
                report += `   - **Module Use Case:** ${opportunity.module_use_case}\n`;
            }
            if (opportunity.key_features && opportunity.key_features.length > 0) {
                report += `   - **Key Features:**\n`;
                opportunity.key_features.forEach(feature => {
                    report += `     - ${feature}\n`;
                });
            }
            report += '\n';
        });
        report += `\n`;
    }

    if (analysis.sales_talking_points && analysis.sales_talking_points.length > 0) {
        report += `## 🗣️ Sales Talking Points\n`;
        analysis.sales_talking_points.forEach((point, index) => {
            report += `${index + 1}. ${point}\n`;
        });
        report += `\n`;
    }

    if (analysis.suggested_partnerships && analysis.suggested_partnerships.length > 0) {
        let partnershipsContent = '';
        analysis.suggested_partnerships.forEach((p, index) => {
            partnershipsContent += `**${index + 1}. ${p.partner_name}**\n`;
            if (p.status) partnershipsContent += `   - Status: ${p.status}\n`; // Added new line for status
            if (p.partner_type) partnershipsContent += `   - Type: ${p.partner_type}\n`;
            if (p.category) partnershipsContent += `   - Category: ${p.category}\n`;
            if (p.relevance_reason) partnershipsContent += `   - Reason: ${p.relevance_reason}\n`;
            if (p.potential_value) partnershipsContent += `   - Potential Value: ${p.potential_value}\n`;
            if (p.ehs_insight_enhancement) partnershipsContent += `   - EHS Insight Enhancement: ${p.ehs_insight_enhancement}\n`;
            partnershipsContent += '\n'; // Add a newline for spacing between partners
        });
        addSection('🤝 Partner Recommendations', partnershipsContent.trim());
    }

    if (analysis.recommendations && analysis.recommendations.length > 0) {
        report += `## AI Recommendations\n`;
        analysis.recommendations.forEach((rec, index) => {
            report += `${index + 1}. ${rec}\n`;
        });
        report += `\n`;
    }

    addSection('📚 Sources & References', analysis.sources_referenced);

    return report.trim();
};

export default function ReportGeneratorCard({ onReportGenerated }) {
    const [companyName, setCompanyName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [statusMessage, setStatusMessage] = useState('');

    const handleGenerateReport = async () => {
        if (!companyName.trim()) {
            setError('Company name is required');
            setStatusMessage('');
            return;
        }

        setIsGenerating(true);
        setError('');
        setStatusMessage('Generating analysis from public sources... Sit tight, this might take a minute');

        const prompt = `
You are "EHS Insight AI Analyst," an expert business intelligence professional specializing in Environmental, Health, and Safety (EHS) and Environmental, Social, and Governance (ESG) research. Your primary goal is to provide our sales team with highly specific, actionable, and verifiable insights into potential clients.

**Target Company:** "${companyName}"

**Core Objective:** Generate a comprehensive EHS/ESG dossier that clearly identifies sales opportunities for EHS Insight's solutions. Every piece of information must be directly supported by publicly available, factual data.

---

**RESEARCH APPROACH:**

1.  **Primary Research:** Look for specific incidents, violations, and documented issues for "${companyName}"
2.  **Fallback Strategy:** If no specific company incidents are found, use industry-specific EHS challenges and regulations that would apply to "${companyName}" based on their business type and industry

**Focus Areas for Research:**
*   **OSHA Violations/Fines:** Specific citations, dates, locations, and monetary penalties for "${companyName}"
*   **EPA/Environmental Incidents:** Company-specific spills, violations, fines, consent decrees
*   **Safety Incidents/Accidents:** Any publicly reported injuries, fatalities, or operational disruptions
*   **Regulatory Enforcement Actions:** Legal or administrative actions against "${companyName}"
*   **Industry-Specific Risks:** Well-documented EHS challenges that companies in "${companyName}'s" industry typically face
*   **Financial Disclosures:** EHS-related risks mentioned in their SEC filings

---

**SALES PAIN POINTS GENERATION:**

**PRIORITY 1 - Company-Specific Pain Points:**
If you find specific incidents, violations, or documented issues for "${companyName}", create pain points based on these findings. Each should reference the specific incident/violation and its consequences.

**PRIORITY 2 - Industry-Specific Pain Points:**
If no specific company incidents are found, generate 3-5 pain points based on well-documented EHS challenges that companies in "${companyName}'s" industry commonly face. Examples:
- For construction companies: fall hazards, silica exposure, equipment safety
- For manufacturing: chemical exposure, machine safety, environmental compliance
- For transportation: driver safety, vehicle maintenance, hazardous material handling

**Requirements for ALL Pain Points:**
- Each must be a single, clear sentence
- Be specific to "${companyName}'s" industry and business type
- Articulate both the challenge and its potential business impact
- Avoid generic statements like "difficulty tracking compliance" - instead be specific about what compliance challenges their industry faces

**Example Industry-Specific Pain Point:**
"Construction companies like ${companyName} face significant silica exposure risks that can lead to OSHA citations averaging $12,000 per violation and long-term worker health liabilities."

---

**SALES OPPORTUNITIES GENERATION:**

For each pain point above, create a corresponding sales opportunity that shows how EHS Insight solves that specific challenge.

Requirements:
-   **opportunity_description**: Clear solution that addresses the pain point
-   **priority_level**: High/Medium/Low based on severity and regulatory requirements
-   **suggested_modules**: Choose from: Incident Management, Compliance Tracking, Training Management, Audit Management, Risk Assessment, Environmental Monitoring, Safety Analytics, Document Management, Contractor Management, Chemical Management
-   **module_use_case**: Specific scenario showing how our modules solve their challenge
-   **key_features**: 2-3 impactful features that directly address the pain point

---

**SALES TALKING POINTS:**

Generate 3-5 conversation starters that reference either:
1.  Specific research findings about "${companyName}"
2.  Industry-specific challenges and regulatory requirements they must address

---

**CRITICAL:** You MUST generate sales pain points, opportunities, and talking points. If no company-specific incidents are found, use industry-specific challenges. Do NOT return empty arrays for these fields.

Remember to also provide all other required fields in the JSON schema, such as company profile, executive summary, etc., with the same high standard of factual accuracy and detail.
        `;

        const response_json_schema = {
            type: "object",
            properties: {
                company_name: { type: "string" },
                industry: { type: "string" },
                naics_code: { type: "number" },
                headquarters_location: { type: "string" },
                annual_revenue: { type: "number" },
                employee_count: { type: "number" },
                profit_margin_percentage: { type: "number" },
                cash_flow_indicators: { type: "string" },
                business_description: { type: "string" },
                key_products_services: { type: "array", items: { type: "string" } },
                executive_summary: { type: "string" },
                common_injury_types: { type: "array", items: { type: "string" } },
                recent_osha_penalties: { type: "number" },
                notable_incidents: { type: "array", items: { type: "string" } },
                financial_risk_factors: { type: "array", items: { type: "string" } },
                regulatory_history: { type: "array", items: { type: "string" } },
                environmental_programs: { type: "array", items: { type: "string" } },
                social_programs: { type: "array", items: { type: "string" } },
                governance_practices: { type: "array", items: { type: "string" } },
                esg_awards_recognitions: { type: "array", items: { type: "string" } },
                esg_ratings: { type: "array", items: { type: "string" } },
                sustainability_goals: { type: "array", items: { type: "string" } },
                industry_trends: { type: "array", items: { type: "string" } },
                applicable_environmental_programs: { type: "object" },
                canada_safety_information: { type: "object" },
                sales_pain_points: { type: "array", items: { type: "string" } },
                sales_opportunities: { type: "array", items: { type: "object" } },
                sales_talking_points: { type: "array", items: { type: "string" } },
                suggested_partnerships: { type: "array", items: { type: "object" } },
                recommendations: { type: "array", items: { type: "string" } },
                sources_referenced: { type: "array", items: { type: "string" } }
            }
        };

        try {
            const response = await InvokeLLM({
                prompt: prompt,
                add_context_from_internet: true,
                response_json_schema: response_json_schema
            });

            if (!response || !response.company_name) {
                throw new Error('Invalid response from AI analysis: missing company name or full response.');
            }

            // NEW ROBUST FALLBACKS
            // Ensure all expected arrays exist, even if the AI omits them, setting them to empty arrays.
            response.recommendations = response.recommendations || [];
            response.suggested_partnerships = response.suggested_partnerships || [];
            response.sources_referenced = response.sources_referenced || [];
            response.sales_pain_points = response.sales_pain_points || [];
            response.sales_opportunities = response.sales_opportunities || [];
            response.sales_talking_points = response.sales_talking_points || [];
            response.common_injury_types = response.common_injury_types || [];
            response.notable_incidents = response.notable_incidents || [];
            response.financial_risk_factors = response.financial_risk_factors || [];
            response.regulatory_history = response.regulatory_history || [];
            response.environmental_programs = response.environmental_programs || [];
            response.social_programs = response.social_programs || [];
            response.governance_practices = response.governance_practices || [];
            response.esg_awards_recognitions = response.esg_awards_recognitions || [];
            response.esg_ratings = response.esg_ratings || [];
            response.sustainability_goals = response.sustainability_goals || [];
            response.industry_trends = response.industry_trends || [];
            response.key_products_services = response.key_products_services || [];
            
            // Filter out bad sources - MORE AGGRESSIVELY
            if (response.sources_referenced && Array.isArray(response.sources_referenced)) {
                response.sources_referenced = response.sources_referenced.filter(source => 
                    typeof source === 'string' && 
                    source.trim() !== '' &&
                    !source.toLowerCase().includes('turnosearch') && 
                    !source.toLowerCase().includes('placeholder') &&
                    source.length > 10 // Ensure the source string is long enough to be meaningful
                );
                
                // If after filtering, no valid sources remain, add a default set.
                if (response.sources_referenced.length === 0) {
                    console.warn("AI did not return valid sources. Using default sources.");
                    response.sources_referenced = [
                        `[${companyName} Website]`,
                        `[Public financial filings for ${companyName}]`,
                        "[OSHA Establishment Search Database]",
                        "[EPA ECHO Database for environmental compliance]"
                    ];
                }
            }


            // Prepare analysis data to be saved and used for report text
            const analysisData = {
                ...response,
                company_name: companyName,
                analysis_date: new Date().toISOString().split('T')[0],
                data_source: 'AI Generated',
            };

            // Build the full report text from the comprehensive analysis data
            analysisData.full_report_text = buildReportText(analysisData);

            setStatusMessage('Saving analysis...');

            // Save to database and get the new record back
            const newAnalysis = await SafetyAnalysis.create(analysisData);

            // Log the dossier generation event
            logDossierGenerated(companyName);

            setStatusMessage('Analysis completed successfully!');
            setCompanyName('');

            // Call the parent callback to refresh the list
            if (onReportGenerated) {
                onReportGenerated();
            }

        } catch (error) {
            console.error('Error generating report:', error);
            const errorMessage = error.message && error.message.includes("JSON schema") ?
                "The AI generated an invalid response. This could be due to a lack of available data or an unexpected AI output format. Please try again or refine the company name." :
                error.message || 'Failed to generate report. Please try again.';
            setError(errorMessage);
            setStatusMessage('');
        }

        setIsGenerating(false);
    };

    return (
        <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-4 sm:p-8 space-y-4 sm:space-y-6">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-2">AI-Powered EHS/ESG Dossier</h3>
                    <p className="text-sm text-slate-600">Enter a company name to generate a comprehensive sales-focused business intelligence report with detailed analysis and recommendations.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="company-name" className="font-semibold">Company Name <span className="text-red-500">*</span></Label>
                    <Input
                        id="company-name"
                        placeholder="e.g., Amazon, Apple, Tesla"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        disabled={isGenerating}
                        autoComplete="off"
                        className="text-base"
                    />
                </div>

                <Button
                    onClick={handleGenerateReport}
                    disabled={!companyName.trim() || isGenerating}
                    className="w-full h-12 text-base"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            <span>{statusMessage || 'Generating Analysis...'}</span>
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5 mr-2" />
                            <span className="hidden sm:inline">Generate Full Analysis</span>
                            <span className="sm:hidden">Generate Analysis</span>
                        </>
                    )}
                </Button>
                {error && (
                    <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
            </CardContent>
        </Card>
    );
}
