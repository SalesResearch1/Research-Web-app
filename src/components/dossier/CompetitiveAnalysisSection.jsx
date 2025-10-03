import React from "react";
import { Star } from "lucide-react";
import InsightBadge from "../common/InsightBadge";

const BulletedList = ({ items, bulletClass }) => (
    <ul className="space-y-2">
        {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 ${bulletClass} rounded-full mt-1.5 flex-shrink-0`}></div>
                <span className="text-slate-700">{item}</span>
            </li>
        ))}
    </ul>
);

const CompetitiveAnalysisSection = ({ analysis }) => {
    const competitorAnalysis = analysis.competitor_analysis;

    if (!competitorAnalysis) return null;

    return (
        <div className="space-y-6">
            {competitorAnalysis.competitive_advantages && competitorAnalysis.competitive_advantages.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Key Competitive Advantages</h4>
                    <BulletedList items={competitorAnalysis.competitive_advantages} bulletClass="bg-green-500" />
                </div>
            )}
            {competitorAnalysis.potential_vulnerabilities && competitorAnalysis.potential_vulnerabilities.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Potential Vulnerabilities</h4>
                    <BulletedList items={competitorAnalysis.potential_vulnerabilities} bulletClass="bg-red-500" />
                </div>
            )}
            {competitorAnalysis.strategic_recommendations && competitorAnalysis.strategic_recommendations.length > 0 && (
                <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Strategic Recommendations</h4>
                    <BulletedList items={competitorAnalysis.strategic_recommendations} bulletClass="bg-blue-500" />
                </div>
            )}
        </div>
    );
};

export default CompetitiveAnalysisSection;