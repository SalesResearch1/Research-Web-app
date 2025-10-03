import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, ShieldCheck } from 'lucide-react';
import { SafetyAnalysis } from '@/api/entities';
import TRIRCalculator from '../components/calculators/TRIRCalculator';
import SafetyPaysCalculator from '../components/calculators/SafetyPaysCalculator';

export default function Calculators() {
    const [analyses, setAnalyses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAnalysisId, setSelectedAnalysisId] = useState(null);
    const [activeTab, setActiveTab] = useState("trir-calculator"); // Added activeTab state

    useEffect(() => {
        const loadAnalyses = async () => {
            setIsLoading(true);
            try {
                const data = await SafetyAnalysis.list("-created_date", 200);
                setAnalyses(data);
            } catch (error) {
                console.error("Error loading safety analyses:", error);
            }
            setIsLoading(false);
        };
        loadAnalyses();
    }, []);

    // Check URL parameters for dossier pre-selection and tab switching
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const dossierId = urlParams.get('dossier');
        const tabParam = urlParams.get('tab');
        
        if (dossierId) {
            setSelectedAnalysisId(dossierId);
        }
        
        if (tabParam === 'safety-pays') {
            setActiveTab('safety-pays');
        }
    }, []); // Runs once on mount

    const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId) || null;

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-4 sm:p-8 max-w-5xl mx-auto">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Safety Calculators</h1>
                    <p className="text-slate-600 text-sm sm:text-lg">Tools to calculate key safety metrics and financial impacts.</p>
                </div>

                <Card className="mb-6 sm:mb-8 bg-white shadow-sm border-slate-200">
                    <CardHeader>
                        <CardTitle>Link to a Dossier</CardTitle>
                        <CardDescription>
                            Optionally, select a company dossier to pre-fill data or save calculation results.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Select
                            value={selectedAnalysisId || ""}
                            onValueChange={(value) => setSelectedAnalysisId(value === "" ? null : value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Link to a safety analysis dossier..." />
                            </SelectTrigger>
                            <SelectContent>
                                {isLoading ? (
                                    <SelectItem value="loading" disabled>Loading dossiers...</SelectItem>
                                ) : (
                                    analyses.map(a => (
                                        <SelectItem key={a.id} value={a.id}>
                                            {a.company_name}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="trir-calculator" className="flex items-center gap-2">
                            <Calculator className="w-4 h-4" /> TRIR Calculator
                        </TabsTrigger>
                        <TabsTrigger value="safety-pays" className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> OSHA Safety Pays
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="trir-calculator">
                        <TRIRCalculator analysis={selectedAnalysis} />
                    </TabsContent>
                    <TabsContent value="safety-pays">
                        <SafetyPaysCalculator analysis={selectedAnalysis} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}