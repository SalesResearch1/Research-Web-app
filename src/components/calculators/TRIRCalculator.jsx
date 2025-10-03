import React, { useState, useEffect } from "react";
import { SafetyAnalysis } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2, Eye, Save } from "lucide-react"; // Updated icons
import { logCalculatorUsed } from '@/components/utils/analytics';
import { Link } from 'react-router-dom';
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Helper function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry API calls with exponential backoff
const retryApiCall = async (apiCall, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.response?.status === 429) {
        const delayMs = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        await delay(delayMs);

        if (attempt === maxRetries - 1) {
          throw new Error("Rate limit exceeded. Please wait a moment and try again.");
        }
      } else {
        throw error;
      }
    }
  }
};

export default function TRIRCalculator({ analysis }) {
    const [injuries, setInjuries] = useState('');
    const [hoursWorked, setHoursWorked] = useState('');
    const [employeeCount, setEmployeeCount] = useState('');
    const [trir, setTrir] = useState(null); // Changed to null to indicate no calculation yet
    const [isSaving, setIsSaving] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);

    // useEffect to pre-fill data from the passed analysis prop
    useEffect(() => {
        if (analysis) {
            // Pre-fill employee count if available
            if (analysis.employee_count) {
                setEmployeeCount(analysis.employee_count.toString());
                // Estimate hours worked (2000 hours per employee per year is standard)
                setHoursWorked((analysis.employee_count * 2000).toString());
            } else {
                // Clear if employee_count is not available or analysis changes
                setEmployeeCount('');
                setHoursWorked('');
            }
            // Clear calculation results and injuries when analysis changes
            setInjuries('');
            setTrir(null);
        } else {
            // If no analysis is passed, clear all fields
            setEmployeeCount('');
            setHoursWorked('');
            setInjuries('');
            setTrir(null);
        }
    }, [analysis]);

    const calculateTRIR = () => {
        const injuriesNum = parseFloat(injuries);
        const hoursNum = parseFloat(hoursWorked);
        
        if (isNaN(injuriesNum) || injuriesNum < 0) {
            alert("Please enter a valid non-negative number for Total Injuries.");
            return;
        }
        if (isNaN(hoursNum) || hoursNum <= 0) {
            alert("Please enter a valid positive number for Total Hours Worked.");
            return;
        }

        const calculatedTRIR = (injuriesNum * 200000) / hoursNum;
        setTrir(calculatedTRIR.toFixed(2));
        
        // Log the calculator usage (without save)
        logCalculatorUsed('TRIR', analysis?.company_name || 'N/A (No Dossier Selected)', false);
    };

    const handleSaveToDossier = async () => {
        if (!analysis) {
            alert('A dossier must be selected from the main page to save calculation results.');
            return;
        }

        if (trir === null) {
            alert('Please calculate TRIR first.');
            return;
        }

        setIsSaving(true);
        setShowSaveSuccess(false); // Reset success message before saving

        try {
            await retryApiCall(() => SafetyAnalysis.update(analysis.id, {
                trir: parseFloat(trir) // Only update the TRIR field
            }));
            
            // Log the calculator usage (with save)
            logCalculatorUsed('TRIR', analysis.company_name, true);

            // alert('TRIR saved to dossier successfully!'); // Replaced by UI alert
            setShowSaveSuccess(true);
            setTimeout(() => setShowSaveSuccess(false), 5000); // Hide success message after 5 seconds
            
        } catch (error) {
            console.error('Error saving TRIR:', error);
            alert(error.message || 'Failed to save TRIR calculation. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    TRIR Calculator
                </CardTitle>
                <p className="text-sm text-slate-600">
                    Calculate Total Recordable Incident Rate using OSHA's standard formula.
                </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
                {/* Company Display (if analysis prop is provided) */}
                {analysis && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-1">Selected Company</h4>
                        <p className="text-blue-800">{analysis.company_name}</p>
                        {analysis.industry && <p className="text-sm text-blue-700">Industry: {analysis.industry}</p>}
                    </div>
                )}

                {/* Removed the Select Dossier dropdown section entirely */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="injuries">Total Recordable Injuries</Label>
                        <Input
                            id="injuries"
                            type="number"
                            placeholder="e.g., 5"
                            value={injuries}
                            onChange={(e) => setInjuries(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Number of OSHA recordable injuries and illnesses
                        </p>
                    </div>
                    
                    <div>
                        <Label htmlFor="hours-worked">Total Hours Worked</Label>
                        <Input
                            id="hours-worked"
                            type="number"
                            placeholder="e.g., 500000"
                            value={hoursWorked}
                            onChange={(e) => setHoursWorked(e.target.value)}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Annual hours worked by all employees
                        </p>
                    </div>
                    
                    <div>
                        <Label htmlFor="employee-count">Employee Count</Label>
                        <Input
                            id="employee-count"
                            type="number"
                            placeholder="e.g., 250"
                            value={employeeCount}
                            onChange={(e) => {
                                setEmployeeCount(e.target.value);
                                // Auto-calculate hours worked (2000 hours per employee per year is standard)
                                const count = parseFloat(e.target.value);
                                if (!isNaN(count) && count > 0) {
                                    setHoursWorked((count * 2000).toString());
                                } else {
                                    setHoursWorked(''); // Clear hours if count is invalid
                                }
                            }}
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            Number of full-time equivalent employees
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <Button 
                        onClick={calculateTRIR}
                        disabled={!injuries || !hoursWorked || parseFloat(hoursWorked) <= 0}
                        className="bg-blue-600 hover:bg-blue-700"
                        size="lg"
                    >
                        <Calculator className="w-5 h-5 mr-2" />
                        Calculate TRIR
                    </Button>
                </div>

                {trir !== null && ( // Only display if TRIR has been calculated
                    <div className="space-y-4">
                        <div className="p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200 text-center">
                            <h3 className="text-lg font-semibold mb-2 text-slate-800">Calculated TRIR</h3>
                            <p className="text-4xl font-bold text-blue-600 mb-2">{trir}</p>
                            <p className="text-sm text-slate-600">
                                Incidents per 100 full-time employees per year
                            </p>
                            
                            <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                                <h4 className="font-semibold text-slate-700 mb-2">Formula Used</h4>
                                <p className="text-sm text-slate-600">
                                    TRIR = (Number of Injuries × 200,000) ÷ Total Hours Worked
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    200,000 = 100 employees working 40 hours/week for 50 weeks/year
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                            {analysis && ( // Only show save/view dossier if an analysis prop is provided
                                <>
                                    <Button 
                                        onClick={handleSaveToDossier}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save to Dossier
                                    </Button>
                                    
                                    <Link to={createPageUrl('ClientDossier') + `?id=${analysis.id}`}>
                                        <Button variant="outline" className="flex items-center gap-2">
                                            <Eye className="w-4 h-4" />
                                            View Dossier
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </div>

                        {showSaveSuccess && (
                            <Alert className="bg-green-50 border-green-200 text-green-800">
                                <AlertDescription>
                                    ✅ TRIR saved to dossier successfully!
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {!analysis && (
                    <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                        <AlertDescription>
                            💡 Select a company dossier from the main page to pre-fill data and save calculation results.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}