import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export default function MetricCard({ title, value, icon: Icon, description, color = "bg-blue-100 text-blue-600" }) {
    return (
        <Card className="bg-white shadow-sm border-slate-200">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-600">{title}</p>
                        <p className="text-3xl font-bold text-slate-900">{value}</p>
                        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
                    </div>
                    <div className={`p-3 ${color} rounded-full`}>
                        <Icon className="w-6 h-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}