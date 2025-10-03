import React, { useState, useEffect } from "react";
import { SafetyAnalysis } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Save, Eye, Loader2, FileDown, Plus, Trash2, Calculator } from "lucide-react";
import { logCalculatorUsed } from '@/components/utils/analytics';
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import jsPDF from 'jspdf';

const INJURY_TYPES = [
    { "label": "AIDS", "direct_cost": 385232, "indirect_cost": 816560 },
    { "label": "Amputation", "direct_cost": 48637, "indirect_cost": 103109 },
    { "label": "Angina Pectoris", "direct_cost": 37137, "indirect_cost": 78721 },
    { "label": "Asbestosis", "direct_cost": 36252, "indirect_cost": 76846 },
    { "label": "Asphyxiation", "direct_cost": 148822, "indirect_cost": 315487 },
    { "label": "Burn", "direct_cost": 2920, "indirect_cost": 6188 },
    { "label": "Cancer", "direct_cost": 50551, "indirect_cost": 107167 },
    { "label": "Carpal Tunnel Syndrome", "direct_cost": 13277, "indirect_cost": 28141 },
    { "label": "Concussion", "direct_cost": 4008, "indirect_cost": 8497 },
    { "label": "Contagious Disease", "direct_cost": 9728, "indirect_cost": 20621 },
    { "label": "Contusion", "direct_cost": 2504, "indirect_cost": 5308 },
    { "label": "Crushing", "direct_cost": 5658, "indirect_cost": 11993 },
    { "label": "Cut/Laceration", "direct_cost": 1689, "indirect_cost": 3579 },
    { "label": "Dermatitis", "direct_cost": 973, "indirect_cost": 2063 },
    { "label": "Dislocation", "direct_cost": 3546, "indirect_cost": 7517 },
    { "label": "Dust Disease, NOC", "direct_cost": 30951, "indirect_cost": 65618 },
    { "label": "Electric Shock", "direct_cost": 55595, "indirect_cost": 117842 },
    { "label": "Enucleation (remove ex: tumor, eye, etc.)", "direct_cost": 20019, "indirect_cost": 42437 },
    { "label": "Foreign Body", "direct_cost": 924, "indirect_cost": 1959 },
    { "label": "Fracture", "direct_cost": 7531, "indirect_cost": 15968 },
    { "label": "Freezing", "direct_cost": 4588, "indirect_cost": 9725 },
    { "label": "Hearing Loss or Impairment (traumatic only)", "direct_cost": 7562, "indirect_cost": 16034 },
    { "label": "Hearing Loss (occupational disease or cumulative injury)", "direct_cost": 23566, "indirect_cost": 49956 },
    { "label": "Heat Prostration", "direct_cost": 5437, "indirect_cost": 0 },
    { "label": "Heat burn", "direct_cost": 3176, "indirect_cost": 6733 },
    { "label": "Hernia", "direct_cost": 8247, "indirect_cost": 17485 },
    { "label": "Infection", "direct_cost": 6013, "indirect_cost": 12747 },
    { "label": "Inflammation", "direct_cost": 3239, "indirect_cost": 6868 },
    { "label": "Mental Disorder", "direct_cost": 20774, "indirect_cost": 44037 },
    { "label": "Mental Stress", "direct_cost": 11399, "indirect_cost": 24166 },
    { "label": "Multiple Injuries Including Both Physical and Psychological", "direct_cost": 25188, "indirect_cost": 53396 },
    { "label": "Multiple Physical Injuries Only", "direct_cost": 16974, "indirect_cost": 35984 },
    { "label": "Myocardial Infarction (heart attack)", "direct_cost": 58349, "indirect_cost": 123699 },
    { "label": "No Physical Injury", "direct_cost": 2789, "indirect_cost": 5913 },
    { "label": "Poisoning - Chemical (other than metals)", "direct_cost": 2548, "indirect_cost": 5402 },
    { "label": "Poisoning - General (not OD or cumulative injury)", "direct_cost": 3059, "indirect_cost": 0 },
    { "label": "Poisoning - Metal", "direct_cost": 2746, "indirect_cost": 0 },
    { "label": "Puncture", "direct_cost": 1516, "indirect_cost": 3213 },
    { "label": "Radiation", "direct_cost": 10131, "indirect_cost": 21476 },
    { "label": "Respiratory Disorders (gases, fumes, chemicals, etc.)", "direct_cost": 34923, "indirect_cost": 74021 },
    { "label": "Rupture", "direct_cost": 4286, "indirect_cost": 9085 },
    { "label": "Severance", "direct_cost": 2504, "indirect_cost": 5308 },
    { "label": "Silicosis", "direct_cost": 37842, "indirect_cost": 80217 },
    { "label": "Soreness/pain", "direct_cost": 3239, "indirect_cost": 6868 },
    { "label": "Sprain/strain", "direct_cost": 3239, "indirect_cost": 6868 },
    { "label": "Syncope", "direct_cost": 5739, "indirect_cost": 0 },
    { "label": "Tendonitis", "direct_cost": 3239, "indirect_cost": 6868 },
    { "label": "Vascular", "direct_cost": 4792, "indirect_cost": 10159 },
    { "label": "Vision Loss", "direct_cost": 20388, "indirect_cost": 43218 },
    { "label": "All Other Cumulative Injury, NOC", "direct_cost": 20774, "indirect_cost": 0 },
    { "label": "All Other Occupational Disease", "direct_cost": 36252, "indirect_cost": 76846 },
    { "label": "All Other Specific Injuries, NOC", "direct_cost": 4286, "indirect_cost": 9085 }
];

export default function SafetyPaysCalculator({ analysis }) {
  const [selectedInjuries, setSelectedInjuries] = useState([]);
  const [profitMargin, setProfitMargin] = useState('3'); // Default to 3%
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [selectedInjuryType, setSelectedInjuryType] = useState('');
  const [injuryCount, setInjuryCount] = useState('');

  useEffect(() => {
    if (analysis) {
      if (analysis.profit_margin_percentage !== undefined && analysis.profit_margin_percentage !== null) {
        setProfitMargin(analysis.profit_margin_percentage.toString());
      } else {
        setProfitMargin('3'); // Default to 3 if analysis has no margin
      }
      // Reset selected injuries when analysis changes
      setSelectedInjuries([]);
    } else {
      // Default to 3 if no analysis is selected
      setProfitMargin('3');
      setSelectedInjuries([]);
    }
  }, [analysis]);

  const totalDirectCosts = selectedInjuries.reduce((sum, injury) => sum + (injury.direct_cost * injury.count), 0);
  const totalIndirectCosts = selectedInjuries.reduce((sum, injury) => sum + (injury.indirect_cost * injury.count), 0);
  const totalCosts = totalDirectCosts + totalIndirectCosts;
  const salesNeeded = (profitMargin && parseFloat(profitMargin) > 0) ? totalCosts / (parseFloat(profitMargin) / 100) : 0;

  const addInjury = () => {
    if (!selectedInjuryType || !injuryCount || parseInt(injuryCount) <= 0) {
      alert('Please select an injury type and enter a valid number of cases.');
      return;
    }

    const injuryType = INJURY_TYPES.find(type => type.label === selectedInjuryType);
    if (!injuryType) return;

    const newInjury = {
      ...injuryType,
      count: parseInt(injuryCount),
      id: Date.now() // Simple ID for tracking
    };

    setSelectedInjuries(prev => [...prev, newInjury]);
    setSelectedInjuryType('');
    setInjuryCount('');
  };

  const removeInjury = (id) => {
    setSelectedInjuries(prev => prev.filter(injury => injury.id !== id));
  };

  const logSafetyPaysCalculated = (companyName, totalCost, salesNeeded) => {
    logCalculatorUsed('Safety Pays', companyName, true);
  };

  const handleSaveToDossier = async () => {
    if (!analysis) {
      alert('Please select a dossier first from the top of the page.');
      return;
    }

    if (!profitMargin || parseFloat(profitMargin) <= 0) {
      alert('Please enter a valid Profit Margin greater than 0 to save.');
      return;
    }

    try {
      setIsSaving(true);
      setShowSaveSuccess(false);

      const calculationData = {
        selected_injuries_breakdown: selectedInjuries.map(injury => ({
          label: injury.label,
          count: injury.count,
          direct_cost: injury.direct_cost,
          indirect_cost: injury.indirect_cost,
          total_cost: (injury.direct_cost * injury.count) + (injury.indirect_cost * injury.count)
        })),
        total_direct_costs: totalDirectCosts,
        total_indirect_costs: totalIndirectCosts,
        combined_total_cost: totalCosts,
        profit_margin_used: parseFloat(profitMargin),
        sales_needed_to_cover: salesNeeded,
        calculation_date: new Date().toISOString().split('T')[0]
      };
      
      await SafetyAnalysis.update(analysis.id, {
        safety_pays_calculation: calculationData,
      });

      logSafetyPaysCalculated(analysis.company_name, totalCosts, salesNeeded);
      
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 5000);
      
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert(error.message || 'Failed to save calculation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('OSHA Safety Pays Calculation', 20, 30);
    
    if (analysis) {
        doc.setFontSize(14);
        doc.text(`Company: ${analysis.company_name}`, 20, 50);
        doc.text(`Industry: ${analysis.industry || 'N/A'}`, 20, 60);
    }
    
    doc.setFontSize(12);
    let yPosition = analysis ? 70 : 50;
    
    doc.text('Injury Breakdown:', 20, yPosition);
    yPosition += 10;
    
    selectedInjuries.forEach(injury => {
        const totalInjuryCost = (injury.direct_cost * injury.count) + (injury.indirect_cost * injury.count);
        doc.text(`${injury.label} (${injury.count} cases): $${totalInjuryCost.toLocaleString()}`, 20, yPosition);
        yPosition += 8;
    });
    
    yPosition += 10;
    doc.text(`Total Direct Costs: $${totalDirectCosts.toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Total Indirect Costs: $${totalIndirectCosts.toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Combined Total Cost: $${totalCosts.toLocaleString()}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Profit Margin: ${profitMargin}%`, 20, yPosition);
    yPosition += 8;
    doc.text(`Sales Needed to Cover: $${salesNeeded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, yPosition);
    
    const fileName = analysis ? `${analysis.company_name.replace(/\s+/g, '_')}_Safety_Pays_Calculation.pdf` : 'Safety_Pays_Calculation.pdf';
    doc.save(fileName);
  };

  return (
    <Card className="bg-white shadow-lg border-slate-200 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">OSHA Safety Pays Calculator</h2>
            <p className="text-sm text-slate-600 font-normal">
              Calculate the true cost of workplace injuries and required sales to offset them
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8">
        {analysis && (
          <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-blue-600 rounded-md">
                <Calculator className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-semibold text-blue-900">Linked Company Dossier</h4>
            </div>
            <p className="text-blue-800 font-medium text-lg">{analysis.company_name}</p>
            {analysis.industry && <p className="text-sm text-blue-700 mt-1">Industry: {analysis.industry}</p>}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-green-600" />
              Add Workplace Injuries
            </h3>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-2">
                  <Label htmlFor="injury-type" className="text-sm font-medium text-slate-700 mb-2 block">
                    Select Injury Type
                  </Label>
                  <Select value={selectedInjuryType} onValueChange={setSelectedInjuryType}>
                    <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Choose an injury type..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {INJURY_TYPES.map((injury) => (
                        <SelectItem key={injury.label} value={injury.label} className="py-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{injury.label}</span>
                            <span className="text-xs text-slate-500">
                              Direct: ${injury.direct_cost.toLocaleString()} | Indirect: ${injury.indirect_cost.toLocaleString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="injury-count" className="text-sm font-medium text-slate-700 mb-2 block">
                    Number of Cases
                  </Label>
                  <Input
                    id="injury-count"
                    type="number"
                    min="1"
                    value={injuryCount}
                    onChange={(e) => setInjuryCount(e.target.value)}
                    placeholder="e.g., 2"
                    className="h-11 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                
                <Button 
                  onClick={addInjury} 
                  className="h-11 bg-green-600 hover:bg-green-700 text-white shadow-sm"
                  disabled={!selectedInjuryType || !injuryCount}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Injury
                </Button>
              </div>
            </div>
          </div>

          {selectedInjuries.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-slate-600" />
                Selected Injuries ({selectedInjuries.length})
              </h4>
              <div className="space-y-3">
                {selectedInjuries.map((injury) => (
                  <div key={injury.id} className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-slate-800">{injury.label}</span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-full">
                            {injury.count} case{injury.count > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Direct Cost:</span>
                            <div className="font-medium text-blue-600">${(injury.direct_cost * injury.count).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Indirect Cost:</span>
                            <div className="font-medium text-purple-600">${(injury.indirect_cost * injury.count).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Total Cost:</span>
                            <div className="font-bold text-red-600">${((injury.direct_cost + injury.indirect_cost) * injury.count).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeInjury(injury.id)}
                        className="ml-4 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
          <Label htmlFor="profit-margin" className="text-sm font-medium text-slate-700 mb-3 block">
            Company Profit Margin (%)
          </Label>
          <Input
            id="profit-margin"
            type="number"
            step="0.1"
            placeholder="e.g., 3.0"
            value={profitMargin}
            onChange={(e) => setProfitMargin(e.target.value)}
            className="h-11 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500 text-lg font-medium"
          />
          <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
            💡 This determines how much additional revenue is needed to offset injury costs
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Defaults to 3% if no company-specific margin is available.
          </p>
        </div>

        {totalCosts > 0 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-blue-50 p-6 rounded-2xl border border-emerald-200 shadow-sm">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                <div className="p-2 bg-emerald-600 rounded-lg">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                Calculation Results
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100">
                  <h4 className="font-semibold text-blue-700 mb-1 text-sm">Direct Costs</h4>
                  <p className="text-2xl font-bold text-blue-600">${totalDirectCosts.toLocaleString()}</p>
                  <p className="text-xs text-blue-500 mt-1">Medical, compensation</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-purple-100">
                  <h4 className="font-semibold text-purple-700 mb-1 text-sm">Indirect Costs</h4>
                  <p className="text-2xl font-bold text-purple-600">${totalIndirectCosts.toLocaleString()}</p>
                  <p className="text-xs text-purple-500 mt-1">Lost productivity, training</p>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                  <h4 className="font-semibold text-red-700 mb-1 text-sm">Total Impact</h4>
                  <p className="text-2xl font-bold text-red-600">${totalCosts.toLocaleString()}</p>
                  <p className="text-xs text-red-500 mt-1">Combined cost burden</p>
                </div>
                
                {salesNeeded > 0 && (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                    <h4 className="font-semibold text-green-700 mb-1 text-sm">Sales Required</h4>
                    <p className="text-2xl font-bold text-green-600">${salesNeeded.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-green-500 mt-1">Revenue to offset costs</p>
                  </div>
                )}
              </div>
              
              {profitMargin && (
                <div className="bg-white/70 backdrop-blur-sm p-3 rounded-lg border border-emerald-200">
                  <p className="text-center text-sm text-slate-700">
                    📊 Based on <span className="font-semibold text-emerald-700">{profitMargin}% profit margin</span>
                    {salesNeeded > 0 && totalCosts > 0 && (
                      <span className="ml-2">• <span className="font-medium">{(salesNeeded / totalCosts).toFixed(1)}x</span> multiplier effect</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-200">
              {analysis && (
                <>
                  <Button 
                    onClick={handleSaveToDossier}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save to Dossier
                  </Button>
                  
                  <Link to={createPageUrl('ClientDossier') + `?id=${analysis.id}`}>
                    <Button variant="outline" className="flex items-center gap-2 border-slate-300 hover:bg-slate-50">
                      <Eye className="w-4 h-4" />
                      View Dossier
                    </Button>
                  </Link>
                </>
              )}
              <Button 
                variant="outline" 
                onClick={downloadPDF}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-50"
                disabled={totalCosts === 0}
              >
                <FileDown className="w-4 h-4" />
                Download PDF Report
              </Button>
            </div>

            {showSaveSuccess && (
              <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
                <AlertDescription className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Calculation saved to dossier successfully!
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!analysis && (
          <Alert className="bg-amber-50 border-amber-200 text-amber-800">
            <AlertDescription className="flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              Select a company dossier at the top of the page to pre-fill data and save results.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}