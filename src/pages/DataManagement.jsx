
import React, { useState, useEffect } from "react";
import { SafetyAnalysis } from "@/api/entities";
import { User } from "@/api/entities"; // New import
import AccessDenied from '../components/common/AccessDenied'; // New import
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Sparkles, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { deleteDuplicateAnalyses } from "@/api/functions";

export default function DataManagement() {
  const [analyses, setAnalyses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isDeduplicating, setIsDeduplicating] = useState(false);
  const [sortOrder, setSortOrder] = useState('none'); // 'none', 'asc', 'desc'
  const [user, setUser] = useState(null); // New state
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // New state

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser?.role === 'admin') {
          await loadAnalyses();
        } else {
          setIsLoading(false); // If not admin, no analyses to load, stop loading indicator
        }
      } catch (error) {
        console.error("Error checking user authentication:", error);
        setUser(null); // Clear user if fetching fails (e.g., not logged in)
        setIsLoading(false); // Stop loading even if auth fails
      }
      setIsCheckingAuth(false);
    };
    checkAuthAndLoad();
  }, []);

  const loadAnalyses = async () => {
    setIsLoading(true);
    try {
      const data = await SafetyAnalysis.list("-created_date", 5000);
      setAnalyses(data || []);
    } catch (error) {
      console.error("Error loading analyses:", error);
      setAnalyses([]);
    }
    setIsLoading(false);
  };

  const handleDelete = async (analysisId) => {
    if (confirm("Are you sure you want to delete this analysis?")) {
      setIsDeleting(analysisId);
      try {
        await SafetyAnalysis.delete(analysisId);
        setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      } catch (error) {
        console.error("Error deleting analysis:", error);
        alert("Failed to delete analysis.");
      }
      setIsDeleting(null);
    }
  };
  
  const handleCleanDuplicates = async () => {
    if (confirm("This will find all duplicate entries based on company name and delete the older ones. Are you sure you want to proceed?")) {
      setIsDeduplicating(true);
      try {
        const result = await deleteDuplicateAnalyses();
        alert(result.data.message || "Cleanup process completed.");
        await loadAnalyses();
      } catch(error) {
        console.error("Error cleaning duplicates: ", error);
        alert(error.response?.data?.error || "An error occurred during cleanup.");
      }
      setIsDeduplicating(false);
    }
  }

  const handleSort = () => {
    if (sortOrder === 'none') {
      setSortOrder('asc');
    } else if (sortOrder === 'asc') {
      setSortOrder('desc');
    } else {
      setSortOrder('none');
    }
  };

  const getSortedAnalyses = () => {
    if (sortOrder === 'none') {
      return analyses;
    }
    
    return [...analyses].sort((a, b) => {
      const nameA = (a.company_name || '').toLowerCase();
      const nameB = (b.company_name || '').toLowerCase();
      
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });
  };

  const getSortIcon = () => {
    if (sortOrder === 'asc') return <ArrowUp className="w-4 h-4" />;
    if (sortOrder === 'desc') return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  const sortedAnalyses = getSortedAnalyses();

  // Conditional rendering based on authentication and role
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 sm:p-8 max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Data Management</h1>
          <p className="text-slate-600 text-sm sm:text-lg">View, manage, and delete your analysis records.</p>
        </div>
        <Button onClick={handleCleanDuplicates} disabled={isDeduplicating} className="mt-4 sm:mt-0">
          {isDeduplicating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          Clean Duplicates
        </Button>
      </div>

      <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Actions</TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  onClick={handleSort}
                  className="flex items-center gap-2 p-0 h-auto font-medium hover:bg-transparent"
                >
                  Company Name
                  {getSortIcon()}
                </Button>
              </TableHead>
              <TableHead>Industry</TableHead>
              <TableHead>Analysis Date</TableHead>
              <TableHead>Data Source</TableHead>
              <TableHead>TRIR</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan="6" className="h-24 text-center">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-slate-400" />
                </TableCell>
              </TableRow>
            ) : sortedAnalyses.length === 0 ? (
              <TableRow>
                <TableCell colSpan="6" className="h-24 text-center">
                  No analyses found.
                </TableCell>
              </TableRow>
            ) : (
              sortedAnalyses.map((analysis) => (
                <TableRow key={analysis.id}>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(analysis.id)}
                      disabled={isDeleting === analysis.id}
                      className="flex items-center gap-2"
                    >
                      {isDeleting === analysis.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                      Delete
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{analysis.company_name}</TableCell>
                  <TableCell>{analysis.industry}</TableCell>
                  <TableCell>
                    {analysis.analysis_date ? format(new Date(analysis.analysis_date), 'yyyy-MM-dd') : 'N/A'}
                  </TableCell>
                  <TableCell>{analysis.data_source}</TableCell>
                  <TableCell>{analysis.trir !== null ? analysis.trir : 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
