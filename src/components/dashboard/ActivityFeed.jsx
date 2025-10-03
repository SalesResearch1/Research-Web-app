import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Activity, 
    FileText, 
    Eye, 
    Search, 
    Calculator, 
    Download,
    HelpCircle,
    BarChart3
} from 'lucide-react';
import { format } from 'date-fns';

const ACTIVITY_CONFIG = {
    dossier_generated: { 
        label: 'Dossier Generated', 
        icon: FileText, 
        color: 'bg-blue-100 text-blue-800',
        showViewButton: true
    },
    dossier_viewed: { 
        label: 'Dossier Viewed', 
        icon: Eye, 
        color: 'bg-green-100 text-green-800',
        showViewButton: true
    },
    regulatory_search: { 
        label: 'Regulatory Search', 
        icon: Search, 
        color: 'bg-indigo-100 text-indigo-800' 
    },
    regulatory_search_saved: { 
        label: 'Search Saved', 
        icon: Search, 
        color: 'bg-teal-100 text-teal-800' 
    },
    trir_calculated: { 
        label: 'TRIR Calculated', 
        icon: Calculator, 
        color: 'bg-orange-100 text-orange-800' 
    },
    safety_pays_calculated: { 
        label: 'Safety Pays Calculated', 
        icon: Calculator, 
        color: 'bg-red-100 text-red-800' 
    },
    pdf_downloaded: { 
        label: 'PDF Downloaded', 
        icon: Download, 
        color: 'bg-purple-100 text-purple-800' 
    },
    training_ai_query: { 
        label: 'Training Query', 
        icon: HelpCircle, 
        color: 'bg-cyan-100 text-cyan-800' 
    },
    training_document_viewed: { 
        label: 'Document Viewed', 
        icon: FileText, 
        color: 'bg-slate-100 text-slate-800' 
    },
    data_exported: { 
        label: 'Data Exported', 
        icon: Download, 
        color: 'bg-amber-100 text-amber-800' 
    },
};

const ActivityItem = ({ activity, onViewAnalysis }) => {
    const config = ACTIVITY_CONFIG[activity.event_type] || {
        label: activity.event_type,
        icon: Activity,
        color: 'bg-gray-100 text-gray-800'
    };
    
    const Icon = config.icon;

    return (
        <div className="flex items-start justify-between p-4 border-b border-slate-100 last:border-b-0">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-100 rounded-full flex-shrink-0">
                    <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={config.color}>
                            {config.label}
                        </Badge>
                        <span className="text-sm text-slate-500">
                            {format(new Date(activity.timestamp), 'MMM d, h:mm a')}
                        </span>
                    </div>
                    <p className="text-sm text-slate-900 font-medium">
                        {activity.user_email || 'Unknown User'}
                    </p>
                    {activity.company_name && (
                        <p className="text-sm text-slate-600">
                            Company: {activity.company_name}
                        </p>
                    )}
                    {activity.feature_used && (
                        <p className="text-xs text-slate-500">
                            Feature: {activity.feature_used}
                        </p>
                    )}
                </div>
            </div>
            
            {config.showViewButton && activity.dossier_id && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewAnalysis(activity)}
                    className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                </Button>
            )}
        </div>
    );
};

export default function ActivityFeed({ activities, onViewAnalysis }) {
    return (
        <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p>No recent activity to display</p>
                        <p className="text-sm">Activity will appear here as users interact with the platform</p>
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {activities.map((activity, index) => (
                            <ActivityItem 
                                key={activity.id || index} 
                                activity={activity} 
                                onViewAnalysis={onViewAnalysis}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}