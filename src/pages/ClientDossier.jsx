
import React, { useState, useEffect } from "react";
import { SafetyAnalysis } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Building2,
    ListChecks,
    AlertTriangle,
    Leaf,
    Users,
    Shield,
    Award,
    TrendingUp,
    ArrowLeft,
    FileDown,
    Loader2,
    Target,
    Star,
    Package as PackageIcon,
    FileText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const sanitizeText = (text) => {
    if (typeof text !== 'string') return text;
    let sanitized = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    sanitized = sanitized.replace(/https?:\/\S+/g, '');
    return sanitized.trim();
};

const BulletedList = ({ items, bulletClass }) => (
    <ul className="space-y-2">
        {items && items.length > 0 ? items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 ${bulletClass} rounded-full mt-1.5 flex-shrink-0`}></div>
                <span className="text-slate-700">{sanitizeText(item)}</span>
            </li>
        )) : (
            <li className="text-slate-500 italic">No information available</li>
        )}
    </ul>
);

const SourceLink = ({ source }) => {
    if (!source || typeof source !== 'string' || source.trim() === '') {
        return <span className="text-slate-500 italic">No source information available</span>;
    }

    const markdownMatch = source.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (markdownMatch) {
        return <a href={markdownMatch[2]} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{markdownMatch[1]}</a>;
    }

    const searchMatch = source.match(/^\[(.*?)\]$/);
    if (searchMatch) {
        const query = encodeURIComponent(searchMatch[1]);
        return <a href={`https://www.google.com/search?q=${query}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{searchMatch[1]}</a>;
    }

    if (source.trim().startsWith('http://') || source.trim().startsWith('https://')) {
        return <a href={source} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">{source}</a>;
    }

    return <span className="text-slate-700">{source}</span>;
};

// Placeholder Component for Competitive Analysis
const CompetitiveAnalysisSection = ({ analysis }) => {
    // This component is a placeholder to ensure the file compiles and runs.
    // In a real application, this would contain logic to display competitive analysis.
    if (!analysis || !analysis.competitive_analysis_data) return null; // Assuming a field like competitive_analysis_data exists or will exist

    return (
        <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    Competitive Analysis
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-slate-700 italic">
                    Competitive analysis section content goes here. (Placeholder)
                    {/* Example of how you might display data if 'analysis.competitive_analysis_data' was a field */}
                    {/* {analysis.competitive_analysis_data && (
                        <BulletedList items={analysis.competitive_analysis_data} bulletClass="bg-indigo-500" />
                    )} */}
                </p>
            </CardContent>
        </Card>
    );
};

export default function ClientDossier() {
    const [analysis, setAnalysis] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const navigate = useNavigate();

    const isAiGenerated = analysis?.data_source?.includes("AI Generated");

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const analysisId = urlParams.get('id');

        if (analysisId) {
            loadData(analysisId);
        } else {
            setIsLoading(false);
        }
    }, []);

    const loadData = async (analysisId) => {
        setIsLoading(true);
        try {
            const analyses = await SafetyAnalysis.filter({ id: analysisId });
            if (analyses && analyses.length > 0) {
                setAnalysis(analyses[0]);
            } else {
                setAnalysis(null);
            }
        } catch (error) {
            console.error("Error loading analysis data:", error);
            setAnalysis(null);
        }
        setIsLoading(false);
    };

    const downloadPDF = async () => {
        if (!analysis) return;
        setIsDownloading(true);

        try {
            const doc = new jsPDF();
            const pageMargin = 15;
            let y = pageMargin;
            const pageHeight = doc.internal.pageSize.height;
            const effectiveWidth = doc.internal.pageSize.width - (pageMargin * 2);

            // --- Helper Functions ---
            const checkPageBreak = (spaceNeeded) => {
                if (y + spaceNeeded > pageHeight - pageMargin) {
                    doc.addPage();
                    y = pageMargin;
                }
            };

            const addTitle = (text, size = 16, spaceAfter = 8) => {
                checkPageBreak(size + spaceAfter + 5);
                doc.setFontSize(size);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(30, 41, 59); // slate-800
                doc.text(text, pageMargin, y);
                y += size / 2 + spaceAfter;
            };

            const addSubTitle = (text, size = 12, spaceAfter = 6) => {
                checkPageBreak(size + spaceAfter);
                doc.setFontSize(size);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(71, 85, 105); // slate-600
                doc.text(text, pageMargin, y);
                y += size / 2 + spaceAfter;
            };

            const addParagraph = (text) => {
                if (!text) return;
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(51, 65, 85); // slate-700
                const lines = doc.splitTextToSize(sanitizeText(text), effectiveWidth);
                checkPageBreak(lines.length * 5 + 5);
                doc.text(lines, pageMargin, y);
                y += (lines.length * 5) + 5;
            };

            const addBulletedList = (items, bulletColor = [59, 130, 246]) => {
                if (!items || items.length === 0) return;
                doc.setFontSize(10);
                doc.setTextColor(51, 65, 85);
                items.forEach(item => {
                    // This handles both simple strings and objects with opportunity_description
                    const itemText = item.opportunity_description
                        ? `${sanitizeText(item.opportunity_description)} (Priority: ${item.priority_level || 'N/A'})`
                        : sanitizeText(item);

                    const lines = doc.splitTextToSize(itemText, effectiveWidth - 8);
                    checkPageBreak(lines.length * 5 + 3);

                    doc.setFillColor(...bulletColor);
                    doc.circle(pageMargin + 3, y, 1.5, 'F');
                    doc.text(lines, pageMargin + 8, y + 1.5);
                    y += lines.length * 5 + 3;
                });
                y += 5;
            };

            const addKeyValue = (key, value) => {
                if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) return;
                checkPageBreak(8);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(71, 85, 105);
                doc.text(`${key}:`, pageMargin, y);

                doc.setFont(undefined, 'normal');
                doc.setTextColor(51, 65, 85);
                const valueLines = doc.splitTextToSize(String(value), effectiveWidth - 45);
                doc.text(valueLines, pageMargin + 40, y);
                y += (valueLines.length * 5) + 2;
            };

            // --- PDF CONTENT START ---
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text(analysis.company_name, pageMargin, y);
            y += 10;
            doc.setFontSize(14);
            doc.setTextColor(71, 85, 105);
            doc.text("EHS & ESG Analysis", pageMargin, y);
            y += 15;

            // Executive Summary
            if (analysis.executive_summary) {
                addTitle('Executive Summary');
                addParagraph(analysis.executive_summary);
                y += 5;
            }

            // Company Profile
            addTitle('Company Profile');
            if (analysis.business_description) addParagraph(analysis.business_description);
            addKeyValue('Industry', analysis.industry);
            addKeyValue('Headquarters', analysis.headquarters_location);
            addKeyValue('Employees', analysis.employee_count?.toLocaleString());
            if (analysis.key_products_services && analysis.key_products_services.length > 0) {
                addSubTitle('Key Products & Services', 11, 4);
                addBulletedList(analysis.key_products_services, [99, 102, 241]); // indigo
            }
            y += 5;

            // Sales Intelligence
            if (analysis.sales_pain_points?.length > 0 || analysis.sales_opportunities?.length > 0 || analysis.sales_talking_points?.length > 0) {
                addTitle('Sales Intelligence');
                if (analysis.sales_pain_points?.length > 0) {
                    addSubTitle('Key Pain Points', 11, 4);
                    addBulletedList(analysis.sales_pain_points, [239, 68, 68]); // red
                }
                if (analysis.sales_opportunities?.length > 0) {
                    addSubTitle('Sales Opportunities', 11, 4);
                    addBulletedList(analysis.sales_opportunities, [34, 197, 94]); // green
                }
                if (analysis.sales_talking_points?.length > 0) {
                    addSubTitle('Conversation Starters', 11, 4);
                    addBulletedList(analysis.sales_talking_points, [139, 92, 246]); // purple
                }
                y += 5;
            }

            // Partner Recommendations
            if (analysis.suggested_partnerships && analysis.suggested_partnerships.length > 0) {
                addTitle('Partner Recommendations');
                analysis.suggested_partnerships.forEach(partner => {
                    checkPageBreak(30); // Estimate space for each partner block
                    doc.setFontSize(11);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(126, 34, 206); // purple-700
                    doc.text(sanitizeText(partner.partner_name), pageMargin, y);
                    y += 6;

                    doc.setFontSize(10);
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(126, 34, 206); // purple-700
                    let partnerInfo = [];
                    if (partner.partner_type) partnerInfo.push(`Type: ${partner.partner_type}`);
                    if (partner.category) partnerInfo.push(`Category: ${partner.category}`);
                    if (partnerInfo.length > 0) {
                        doc.text(partnerInfo.join(' | '), pageMargin, y);
                        y += 6;
                    }

                    doc.setTextColor(51, 65, 85); // slate-700
                    doc.setFont(undefined, 'bold');
                    doc.text('Why they\'re a fit:', pageMargin, y);
                    doc.setFont(undefined, 'normal');
                    const relevanceLines = doc.splitTextToSize(sanitizeText(partner.relevance_reason), effectiveWidth - 45);
                    doc.text(relevanceLines, pageMargin + 35, y);
                    y += (relevanceLines.length * 5) + 2;

                    if (partner.potential_value) {
                        doc.setFont(undefined, 'bold');
                        doc.text('Potential Value:', pageMargin, y);
                        doc.setFont(undefined, 'normal');
                        const valueLines = doc.splitTextToSize(sanitizeText(partner.potential_value), effectiveWidth - 35);
                        doc.text(valueLines, pageMargin + 30, y);
                        y += (valueLines.length * 5) + 2;
                    }
                    y += 5; // Extra space after each partner
                });
                y += 5;
            }


            // EHS Performance
            if (analysis.recent_osha_penalties || analysis.common_injury_types?.length > 0 || analysis.notable_incidents?.length > 0) {
                addTitle('EHS Performance');
                addKeyValue('Recent OSHA Penalties', analysis.recent_osha_penalties ? `$${analysis.recent_osha_penalties.toLocaleString()}` : null);
                if (analysis.common_injury_types?.length > 0) {
                    addSubTitle('Common Injury Types', 11, 4);
                    addBulletedList(analysis.common_injury_types, [239, 68, 68]);
                }
                if (analysis.notable_incidents?.length > 0) {
                    addSubTitle('Notable Incidents', 11, 4);
                    addBulletedList(analysis.notable_incidents, [239, 68, 68]);
                }
                y += 5;
            }

            // Environmental
            if (analysis.environmental_programs?.length > 0 || analysis.sustainability_goals?.length > 0) {
                addTitle('Environmental & Sustainability');
                if (analysis.environmental_programs?.length > 0) {
                    addSubTitle('Environmental Programs', 11, 4);
                    addBulletedList(analysis.environmental_programs, [34, 197, 94]);
                }
                if (analysis.sustainability_goals?.length > 0) {
                    addSubTitle('Sustainability Goals', 11, 4);
                    addBulletedList(analysis.sustainability_goals, [34, 197, 94]);
                }
                y += 5;
            }

            // ESG
            if (analysis.social_programs?.length > 0 || analysis.governance_practices?.length > 0) {
                addTitle('ESG Profile');
                if (analysis.social_programs?.length > 0) {
                    addSubTitle('Social Programs', 11, 4);
                    addBulletedList(analysis.social_programs, [139, 92, 246]);
                }
                if (analysis.governance_practices?.length > 0) {
                    addSubTitle('Governance Practices', 11, 4);
                    addBulletedList(analysis.governance_practices, [99, 102, 241]);
                }
                y += 5;
            }

            // Awards
            if (analysis.esg_awards_recognitions?.length > 0 || analysis.esg_ratings?.length > 0) {
                addTitle('Awards & Recognition');
                if (analysis.esg_awards_recognitions?.length > 0) {
                    addSubTitle('Awards & Recognition', 11, 4);
                    addBulletedList(analysis.esg_awards_recognitions, [234, 179, 8]); // yellow
                }
                if (analysis.esg_ratings?.length > 0) {
                    addSubTitle('ESG Ratings', 11, 4);
                    addBulletedList(analysis.esg_ratings, [34, 197, 94]);
                }
                y += 5;
            }

            // Sources Referenced
            if (analysis.sources_referenced && analysis.sources_referenced.length > 0) {
                addTitle('Sources Referenced');
                doc.setFontSize(10);
                doc.setTextColor(51, 65, 85);
                analysis.sources_referenced.forEach(source => {
                    checkPageBreak(8); // Estimate space for each link
                    const markdownMatch = source.match(/\[([^\]]+)\]\(([^)]+)\)/);
                    if (markdownMatch) {
                        const linkText = markdownMatch[1];
                        const linkUrl = markdownMatch[2];
                        const display = `${linkText} (${linkUrl})`;
                        const lines = doc.splitTextToSize(display, effectiveWidth);
                        doc.text(lines, pageMargin, y);
                        y += (lines.length * 5) + 2;
                    } else if (source.trim().startsWith('http://') || source.trim().startsWith('https://')) {
                        const lines = doc.splitTextToSize(source, effectiveWidth);
                        doc.text(lines, pageMargin, y);
                        y += (lines.length * 5) + 2;
                    } else {
                        const lines = doc.splitTextToSize(sanitizeText(source), effectiveWidth);
                        doc.text(lines, pageMargin, y);
                        y += (lines.length * 5) + 2;
                    }
                });
                y += 5;
            }

            doc.save(`${analysis.company_name}-EHS-Analysis.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('There was an error generating the PDF. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="flex items-center gap-3 text-slate-600">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Loading analysis...</span>
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen bg-slate-50">
                <div className="text-center p-8">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-slate-800 mb-2">Analysis Not Found</h2>
                    <p className="text-slate-600 mb-6">The requested dossier could not be found. It may have been deleted.</p>
                    <Link to={createPageUrl('SafetyAnalyses')}>
                        <Button>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Analyses
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link to={createPageUrl('SafetyAnalyses')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{analysis.company_name}</h1>
                            <p className="text-slate-600">EHS & ESG Analysis</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            onClick={downloadPDF}
                            disabled={isDownloading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isDownloading ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <FileDown className="w-4 h-4 mr-2" />
                            )}
                            Download PDF
                        </Button>
                    </div>
                </div>

                {isAiGenerated && (
                    <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-900">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle className="font-semibold">AI-Powered Analysis Disclaimer</AlertTitle>
                        <AlertDescription>
                            This dossier was generated by an AI and may contain inaccuracies. Always verify critical information from primary sources.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    {/* Executive Summary */}
                    {analysis.executive_summary && (
                        <Card className="bg-blue-50 border-l-4 border-blue-400 shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <ListChecks className="w-5 h-5 text-blue-600" />
                                    Executive Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-slate-700 leading-relaxed">{sanitizeText(analysis.executive_summary)}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Company Profile - Using correct field names */}
                    {(analysis.business_description || analysis.industry || analysis.headquarters_location || analysis.key_products_services || analysis.employee_count) && (
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-slate-600" />
                                    Company Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analysis.business_description && (
                                    <p className="text-slate-700 leading-relaxed mb-4">{sanitizeText(analysis.business_description)}</p>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                                    {analysis.industry && (
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-1">Industry</h4>
                                            <p className="text-slate-600">{analysis.industry}</p>
                                        </div>
                                    )}
                                    {analysis.headquarters_location && (
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-1">Headquarters</h4>
                                            <p className="text-slate-600">{analysis.headquarters_location}</p>
                                        </div>
                                    )}
                                    {analysis.employee_count && (
                                        <div>
                                            <h4 className="font-semibold text-slate-800 mb-1">Employees</h4>
                                            <p className="text-slate-600">{analysis.employee_count.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>

                                {analysis.key_products_services && analysis.key_products_services.length > 0 && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-slate-800 mb-3">Key Products & Services</h4>
                                        <BulletedList items={analysis.key_products_services} bulletClass="bg-indigo-500" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Sales Intelligence - Using correct field names */}
                    {(analysis.sales_pain_points || analysis.sales_opportunities || analysis.sales_talking_points) && (
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    Sales Intelligence
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {analysis.sales_pain_points && analysis.sales_pain_points.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3 text-red-700 flex items-center gap-2"><AlertTriangle className="w-5 h-5" />Key Pain Points</h4>
                                        <BulletedList items={analysis.sales_pain_points} bulletClass="bg-red-500" />
                                    </div>
                                )}

                                {analysis.sales_opportunities && analysis.sales_opportunities.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3 text-green-700 flex items-center gap-2"><Star className="w-5 h-5" />Sales Opportunities</h4>
                                        <div className="space-y-4">
                                            {analysis.sales_opportunities.map((opportunity, i) => (
                                                <div key={i} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <p className="text-slate-800 font-medium pr-4">{sanitizeText(opportunity.opportunity_description || opportunity)}</p>
                                                        <Badge className={
                                                            opportunity.priority_level === 'High' ? 'bg-red-100 text-red-800 border-red-200' :
                                                            opportunity.priority_level === 'Medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                            'bg-green-100 text-green-800 border-green-200'
                                                        }>
                                                            {opportunity.priority_level} Priority
                                                        </Badge>
                                                    </div>

                                                    {opportunity.module_use_case && (
                                                        <div className="mb-3 p-3 bg-white rounded-md border border-blue-100">
                                                            <h5 className="font-semibold text-slate-800 text-sm mb-1 flex items-center gap-2">
                                                                <Target className="w-4 h-4 text-blue-600" />
                                                                How We Help
                                                            </h5>
                                                            <p className="text-sm text-slate-600">{sanitizeText(opportunity.module_use_case)}</p>
                                                        </div>
                                                    )}

                                                    {opportunity.suggested_modules && opportunity.suggested_modules.length > 0 && (
                                                        <div className="mb-3">
                                                             <h5 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
                                                                <PackageIcon className="w-4 h-4 text-indigo-600" />
                                                                Suggested Modules
                                                            </h5>
                                                            <div className="flex flex-wrap gap-2">
                                                                {opportunity.suggested_modules.map((module, j) => (
                                                                    <span key={j} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                                                                        {module}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {opportunity.key_features && opportunity.key_features.length > 0 && (
                                                         <div>
                                                            <h5 className="font-semibold text-slate-800 text-sm mb-2 flex items-center gap-2">
                                                                <Star className="w-4 h-4 text-yellow-500" />
                                                                Key Features to Mention
                                                            </h5>
                                                            <ul className="list-disc pl-5 text-sm text-slate-600 space-y-1">
                                                                 {opportunity.key_features.map((feature, k) => (
                                                                    <li key={k}>{feature}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {analysis.sales_talking_points && analysis.sales_talking_points.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3 text-purple-700">Conversation Starters</h4>
                                        <BulletedList items={analysis.sales_talking_points} bulletClass="bg-purple-500" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Competitive Analysis */}
                    {/* This component is a placeholder; its actual content and data
                        structure would need to be defined based on requirements. */}
                    <CompetitiveAnalysisSection analysis={analysis} />

                    {/* EHS Performance - Using correct field names */}
                    {(analysis.common_injury_types || analysis.notable_incidents || analysis.recent_osha_penalties) && (
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    EHS Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analysis.recent_osha_penalties && (
                                    <div className="p-3 bg-red-50 rounded-lg">
                                        <h4 className="font-semibold text-slate-800 mb-1">Recent OSHA Penalties</h4>
                                        <p className="text-red-700 font-bold">${analysis.recent_osha_penalties.toLocaleString()}</p>
                                    </div>
                                )}

                                {analysis.common_injury_types && analysis.common_injury_types.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Common Injury Types</h4>
                                        <BulletedList items={analysis.common_injury_types} bulletClass="bg-red-500" />
                                    </div>
                                )}

                                {analysis.notable_incidents && analysis.notable_incidents.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Notable Incidents</h4>
                                        <BulletedList items={analysis.notable_incidents} bulletClass="bg-red-500" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Environmental Profile - Using correct field names */}
                    {(analysis.environmental_programs || analysis.sustainability_goals) && (
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Leaf className="w-5 h-5 text-green-600" />
                                    Environmental & Sustainability Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analysis.environmental_programs && analysis.environmental_programs.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Environmental Programs</h4>
                                        <BulletedList items={analysis.environmental_programs} bulletClass="bg-green-500" />
                                    </div>
                                )}

                                {analysis.sustainability_goals && analysis.sustainability_goals.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Sustainability Goals</h4>
                                        <BulletedList items={analysis.sustainability_goals} bulletClass="bg-green-500" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* ESG Profile - Using correct field names */}
                    {(analysis.social_programs || analysis.governance_practices) && (
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-600" />
                                    ESG Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analysis.social_programs && analysis.social_programs.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Social Programs</h4>
                                        <BulletedList items={analysis.social_programs} bulletClass="bg-purple-500" />
                                    </div>
                                )}

                                {analysis.governance_practices && analysis.governance_practices.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Governance Practices</h4>
                                        <BulletedList items={analysis.governance_practices} bulletClass="bg-indigo-500" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Awards & Recognition - Using correct field names */}
                    {(analysis.esg_awards_recognitions || analysis.esg_ratings) && (
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5 text-yellow-600" />
                                    Awards & Recognition
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {analysis.esg_awards_recognitions && analysis.esg_awards_recognitions.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">Awards & Recognition</h4>
                                        <BulletedList items={analysis.esg_awards_recognitions} bulletClass="bg-yellow-500" />
                                    </div>
                                )}

                                {analysis.esg_ratings && analysis.esg_ratings.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-800 mb-3">ESG Ratings</h4>
                                        <BulletedList items={analysis.esg_ratings} bulletClass="bg-green-500" />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Sources Referenced */}
                    <Card className="bg-white shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-600" />
                                Sources Referenced
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analysis.sources_referenced && analysis.sources_referenced.length > 0 ? (
                                <ul className="list-disc pl-5 space-y-2 text-sm text-slate-700">
                                    {analysis.sources_referenced.map((source, i) => (
                                        <li key={i}><SourceLink source={source} /></li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-slate-500 italic">No specific sources were cited in this analysis.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="mt-8 text-center text-sm text-slate-500">
                    Analysis generated on {format(new Date(analysis.created_date), 'PPP')}
                </div>
            </div>
        </div>
    );
}
