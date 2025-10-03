import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { UserActivity } from '@/api/entities';
import { SafetyAnalysis } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, BookCheck, Search, Calculator } from 'lucide-react';
import MetricCard from '../components/dashboard/MetricCard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import AnalysisDetailsDialog from "../components/history/AnalysisDetailsDialog";

export default function Dashboard() {
    const [user, setUser] = useState(null);
    const [activities, setActivities] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAnalysis, setSelectedAnalysis] = useState(null);

    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Try to get user data, but don't require it
                let userData = null;
                try {
                    userData = await User.me();
                    setUser(userData);
                } catch (userError) {
                    console.log("User not logged in, continuing without user data");
                    setUser(null);
                }

                // Load activities and analyses regardless of login status
                const [activitiesData, analysesData] = await Promise.all([
                    UserActivity.list('-timestamp', 50).catch(e => { 
                        console.warn("Could not load activities:", e);
                        return []; 
                    }),
                    SafetyAnalysis.list('-created_date', 200).catch(e => { 
                        console.warn("Could not load analyses:", e);
                        return []; 
                    })
                ]);

                setActivities(activitiesData);
                setAnalyses(analysesData);

            } catch (err) {
                console.error("Dashboard loading error:", err);
                setError("Some data could not be loaded, but you can still use the dashboard.");
                // Don't block the dashboard from loading
                setActivities([]);
                setAnalyses([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    const metrics = {
        analysesGenerated: analyses.length,
        searchesPerformed: activities.filter(a => a.event_type === 'regulatory_search').length,
        calculationsMade: activities.filter(a => ['trir_calculated', 'safety_pays_calculated'].includes(a.event_type)).length
    };
    
    const handleViewAnalysis = (activity) => {
        if (activity.dossier_id) {
            const analysisToView = analyses.find(a => a.id === activity.dossier_id);
            if(analysisToView) {
                setSelectedAnalysis(analysisToView);
            } else {
                alert("Could not find the associated analysis. It may have been deleted.");
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-screen bg-slate-50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-500" />
                    <p className="text-slate-600">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-4 sm:p-8 max-w-7xl mx-auto">
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">
                        {user ? `Welcome back, ${user.full_name.split(' ')[0]}!` : 'EHS Insight Dashboard'}
                    </h1>
                    <p className="text-slate-600 text-sm sm:text-lg">
                        {user ? "Here's a summary of recent activity." : "Overview of platform activity and insights."}
                    </p>
                </div>

                {error && (
                    <Card className="bg-yellow-50 border-yellow-200 mb-6">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                <p className="text-yellow-800">{error}</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <MetricCard
                        title="Analyses Generated"
                        value={metrics.analysesGenerated}
                        icon={BookCheck}
                        description="Total safety dossiers created"
                    />
                    <MetricCard
                        title="Searches Performed"
                        value={metrics.searchesPerformed}
                        icon={Search}
                        description="Regulatory database queries"
                    />
                    <MetricCard
                        title="Calculations Made"
                        value={metrics.calculationsMade}
                        icon={Calculator}
                        description="TRIR & Safety Pays calculations"
                    />
                </div>

                {/* Recent Activity Feed */}
                <ActivityFeed 
                    activities={activities.slice(0, 15)} 
                    onViewAnalysis={handleViewAnalysis}
                />
            </div>
            
            <AnalysisDetailsDialog
                analysis={selectedAnalysis}
                onClose={() => setSelectedAnalysis(null)}
            />
        </div>
    );
}