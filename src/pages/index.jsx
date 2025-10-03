import Layout from "./Layout.jsx";

import SafetyAnalyses from "./SafetyAnalyses";

import RegulatorySearch from "./RegulatorySearch";

import Calculators from "./Calculators";

import Training from "./Training";

import Analytics from "./Analytics";

import Dashboard from "./Dashboard";

import ClientDossier from "./ClientDossier";

import DataManagement from "./DataManagement";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    SafetyAnalyses: SafetyAnalyses,
    
    RegulatorySearch: RegulatorySearch,
    
    Calculators: Calculators,
    
    Training: Training,
    
    Analytics: Analytics,
    
    Dashboard: Dashboard,
    
    ClientDossier: ClientDossier,
    
    DataManagement: DataManagement,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<SafetyAnalyses />} />
                
                
                <Route path="/SafetyAnalyses" element={<SafetyAnalyses />} />
                
                <Route path="/RegulatorySearch" element={<RegulatorySearch />} />
                
                <Route path="/Calculators" element={<Calculators />} />
                
                <Route path="/Training" element={<Training />} />
                
                <Route path="/Analytics" element={<Analytics />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/ClientDossier" element={<ClientDossier />} />
                
                <Route path="/DataManagement" element={<DataManagement />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}