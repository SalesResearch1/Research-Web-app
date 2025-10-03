import React from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";
import InsightBadge from "../common/InsightBadge";

const EnvironmentalRegulationsSection = ({ regulations }) => {
    if (!regulations) return null;

    const programDetails = {
        Clean_Air_Act_Title_V: {
            name: 'Clean Air Act (Title V)',
            description: 'Major source air emissions permitting program'
        },
        Clean_Water_Act_NPDES: {
            name: 'Clean Water Act (NPDES)',
            description: 'National Pollutant Discharge Elimination System permits'
        },
        Safe_Drinking_Water_Act: {
            name: 'Safe Drinking Water Act (SDWA)',
            description: 'Underground injection control and public water systems'
        },
        RCRA_Hazardous_Waste: {
            name: 'RCRA Hazardous Waste',
            description: 'Resource Conservation and Recovery Act waste management'
        },
        Toxics_Release_Inventory: {
            name: 'Toxics Release Inventory (TRI)',
            description: 'Annual toxic chemical release and waste management reporting'
        },
        SPCC_Oil_Spill_Prevention: {
            name: 'SPCC (Oil Spill Prevention)',
            description: 'Spill Prevention, Control, and Countermeasure plans'
        },
        UST_Underground_Storage_Tanks: {
            name: 'UST (Underground Storage Tanks)',
            description: 'Underground storage tank regulations and monitoring'
        }
    };

    const applicablePrograms = [];
    const notApplicablePrograms = [];

    Object.entries(regulations).forEach(([key, isApplicable]) => {
        const details = programDetails[key];
        if (!details) return;

        const program = { key, ...details, isApplicable };
        if (isApplicable) {
            applicablePrograms.push(program);
        } else {
            notApplicablePrograms.push(program);
        }
    });

    return (
        <div className="space-y-4">
            <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-600">
                    <p className="mb-2">
                        This regulatory landscape assessment is based on typical industry requirements. 
                        Actual applicability may vary by company size, location, and specific operations.
                    </p>
                    <InsightBadge
                        variant="secondary"
                        className="inline-block"
                        insight="Use this as a conversation starter about their current regulatory compliance challenges and how EHS Insight can help streamline their regulatory management."
                    />
                </div>
            </div>

            {applicablePrograms.length > 0 && (
                <div>
                    <h5 className="font-medium text-slate-700 mb-3">
                        Typically Applicable Programs ({applicablePrograms.length})
                    </h5>
                    <ul className="space-y-1">
                        {applicablePrograms.map((program) => (
                            <li key={program.key} className="flex items-center gap-2 text-sm text-slate-600">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                {program.name}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {notApplicablePrograms.length > 0 && (
                <div>
                    <h5 className="font-medium text-slate-700 mb-3">
                        Typically Not Applicable ({notApplicablePrograms.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                        {notApplicablePrograms.map((program) => (
                            <div key={program.key} className="flex items-center gap-2 text-sm text-slate-500">
                                <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                {program.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnvironmentalRegulationsSection;