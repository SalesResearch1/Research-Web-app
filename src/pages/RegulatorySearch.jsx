
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SafetyAnalysis } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Save, Loader2 } from "lucide-react"; // Removed ArrowUpRight and ExternalLink
import { logRegulatorySearch } from '@/components/utils/analytics';
import { createPageUrl } from '@/utils';

const searchSites = [
  {
    id: "violation-tracker",
    name: "Violation Tracker",
    description: "Search for corporate crime and misconduct across federal, state, and local agencies.",
    baseUrl: "https://violationtracker.goodjobsfirst.org/",
    searchUrl: (company) => `https://violationtracker.goodjobsfirst.org/?company=${encodeURIComponent(company)}`
  },
  {
    id: "osha-establishment",
    name: "OSHA Establishment Search",
    description: "Find federal OSHA enforcement inspections by establishment name.",
    baseUrl: "https://www.osha.gov/pls/imis/establishment.html",
    searchUrl: (company) => `https://www.osha.gov/pls/imis/establishment.search?p_logger=1&establishment=${encodeURIComponent(company)}&State=All&officetype=All&Office=All&programlc=All&end_open_date=&end_close_date=&pg_size=25`
  },
  {
    id: "epa-echo",
    name: "EPA ECHO Search",
    description: "Search EPA and state data for environmental compliance and enforcement.",
    baseUrl: "https://echo.epa.gov/",
    searchUrl: (company) => `https://echo.epa.gov/facilities/facility-search/results?p_fn=${encodeURIComponent(company)}`
  }
];

export default function RegulatorySearch() {
  const [companyName, setCompanyName] = useState('');
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState("");
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const location = useLocation(); // Get location object

  useEffect(() => {
    // Check for companyName in URL params on initial load
    const params = new URLSearchParams(location.search);
    const companyFromUrl = params.get('companyName');
    if (companyFromUrl) {
      setCompanyName(companyFromUrl);
    }
    
    loadAnalyses();
  }, [location.search]); // Re-run if search params change

  const loadAnalyses = async () => {
    setIsLoadingAnalyses(true);
    try {
      const data = await SafetyAnalysis.list("-created_date", 50);
      setAnalyses(data || []);
    } catch (error) {
      console.error("Error loading analyses:", error);
      setAnalyses([]);
    }
    setIsLoadingAnalyses(false);
  };

  const handleIndividualSearch = (site) => {
    if (!companyName.trim()) {
      alert('Please enter a company name to search.');
      return;
    }
    
    const searchUrl = site.searchUrl(companyName.trim());
    window.open(searchUrl, '_blank');
    
    // Log the regulatory search
    logRegulatorySearch(companyName.trim(), site.name, false);
  };

  const handleIndividualSearchWithSave = async (site) => {
    if (!companyName.trim()) {
      alert('Please enter a company name to search.');
      return;
    }

    if (!selectedAnalysisId || selectedAnalysisId === "") {
      alert('Please select a dossier to save the search results to.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Find the selected analysis
      const analysis = analyses.find(a => a.id === selectedAnalysisId);
      if (!analysis) {
        alert('Selected dossier not found. Please try selecting again.');
        setIsSaving(false);
        return;
      }
      
      // Create the search URL
      const searchUrl = site.searchUrl(companyName.trim());
      
      // Get existing links or initialize empty array
      const existingLinks = Array.isArray(analysis.regulatory_search_links) ? analysis.regulatory_search_links : [];
      
      // Create new link object
      const newLink = {
        title: `${site.name} Search for ${companyName.trim()}`,
        url: searchUrl,
        database: site.name,
        search_date: new Date().toISOString()
      };
      
      // Update the analysis with the new link
      await SafetyAnalysis.update(selectedAnalysisId, {
        regulatory_search_links: [...existingLinks, newLink]
      });

      // Refresh the analyses list to show the updated data
      await loadAnalyses(); 
      
      // Open the search results AFTER saving
      window.open(searchUrl, '_blank');
      
      // Log the regulatory search with save
      logRegulatorySearch(companyName.trim(), site.name, true);
      
      alert(`Search results for ${site.name} saved to ${analysis.company_name} dossier!`);
      
    } catch (error) {
      console.error('Error saving search link:', error);
      alert(`Failed to save search results: ${error.message}. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Get the selected analysis for display (kept for potential future use or debugging, but not rendered)
  const selectedAnalysis = selectedAnalysisId ? analyses.find(a => a.id === selectedAnalysisId) : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-4 sm:p-8 max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Regulatory Search</h1>
          <p className="text-slate-600 text-sm sm:text-lg">Search external databases for compliance and violation information.</p>
        </div>

        {/* Search Form */}
        <Card className="bg-white shadow-sm border-slate-200 mb-6 sm:mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Search className="w-5 h-5 text-primary-600" />
              Company Search
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter a company name and select which databases to search.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6">
            <div>
              <Label htmlFor="company-name" className="font-medium">Company Name</Label>
              <Input
                id="company-name"
                type="text"
                placeholder="e.g., Amazon, Apple, Tesla"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-2 text-base"
              />
            </div>

            <div>
              <Label className="font-medium">Save Results to Dossier (Optional)</Label>
              <Select value={selectedAnalysisId} onValueChange={setSelectedAnalysisId} disabled={isLoadingAnalyses}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={isLoadingAnalyses ? "Loading dossiers..." : "Select a dossier to save search links"} />
                </SelectTrigger>
                <SelectContent>
                  {analyses.map((analysis) => (
                    <SelectItem key={analysis.id} value={analysis.id}>
                      {analysis.company_name} ({analysis.industry || 'No Industry'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAnalysisId && (
                <p className="text-xs text-slate-500 mt-1">
                  Search result links will be saved to this dossier for easy reference later.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Individual Database Cards */}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4">Search Databases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {searchSites.map((site) => (
            <Card key={site.id} className="bg-white shadow-sm border-slate-200 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Search className="w-4 sm:w-5 h-4 sm:h-5 text-primary-600" />
                  {site.name}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{site.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-end space-y-3">
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={() => handleIndividualSearch(site)}
                    disabled={!companyName.trim()}
                    className="w-full"
                    variant="outline"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Search Company
                  </Button>
                  
                  {site.id !== "epa-echo" ? (
                    <Button 
                      onClick={() => handleIndividualSearchWithSave(site)}
                      disabled={!companyName.trim() || !selectedAnalysisId || isSaving}
                      className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Search & Save to Dossier
                    </Button>
                  ) : (
                    <a href={site.baseUrl} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button variant="outline" className="w-full">
                        Visit EPA ECHO Search
                        {/* ExternalLink icon is intentionally not imported/used here as per changes */}
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
