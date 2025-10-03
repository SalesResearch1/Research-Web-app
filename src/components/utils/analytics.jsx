// Analytics utility for tracking regulatory searches and training activities
export const logRegulatorySearch = (companyName, database, saved) => {
  try {
    // Log to console for now - can be extended to send to analytics service
    console.log('Regulatory Search Event:', {
      company: companyName,
      database: database,
      saved: saved,
      timestamp: new Date().toISOString()
    });
    
    // Future: Send to analytics service
    // analytics.track('regulatory_search', {
    //   company: companyName,
    //   database: database,
    //   saved: saved
    // });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking training queries
export const logTrainingQuery = (query, responseLength) => {
  try {
    // Log to console for now - can be extended to send to analytics service
    console.log('Training Query Event:', {
      query: query.substring(0, 100), // Log first 100 chars for privacy
      responseLength: responseLength,
      timestamp: new Date().toISOString()
    });
    
    // Future: Send to analytics service
    // analytics.track('training_query', {
    //   query: query,
    //   responseLength: responseLength
    // });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking training document views
export const logTrainingDocumentViewed = (documentTitle, documentId) => {
  try {
    // Log to console for now - can be extended to send to analytics service
    console.log('Training Document Viewed:', {
      title: documentTitle,
      documentId: documentId,
      timestamp: new Date().toISOString()
    });
    
    // Future: Send to analytics service
    // analytics.track('training_document_viewed', {
    //   title: documentTitle,
    //   documentId: documentId
    // });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking calculator usage
export const logCalculatorUsed = (calculatorType, companyName, saved) => {
  try {
    // Log to console for now - can be extended to send to analytics service
    console.log('Calculator Used Event:', {
      type: calculatorType,
      company: companyName,
      saved: saved,
      timestamp: new Date().toISOString()
    });
    
    // Future: Send to analytics service
    // analytics.track('calculator_used', {
    //   type: calculatorType,
    //   company: companyName,
    //   saved: saved
    // });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking case study generation
export const logCaseStudyGenerated = (companyName, caseStudyType) => {
  try {
    console.log('Case Study Generated Event:', {
      type: caseStudyType,
      company: companyName,
      timestamp: new Date().toISOString()
    });
    // Future: Send to analytics service
    // analytics.track('case_study_generated', { type: caseStudyType, company: companyName });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking case study downloads
export const logCaseStudyDownloaded = (companyName, caseStudyType, format) => {
  try {
    console.log('Case Study Downloaded Event:', {
      type: caseStudyType,
      company: companyName,
      format: format,
      timestamp: new Date().toISOString()
    });
    // Future: Send to analytics service
    // analytics.track('case_study_downloaded', { type: caseStudyType, company: companyName, format: format });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking page visits
export const logPageVisit = (pageName) => {
  try {
    console.log('Page Visit Event:', {
      page: pageName,
      timestamp: new Date().toISOString()
    });
    // Future: Send to analytics service
    // analytics.track('page_visited', { page: pageName });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking dossier generation
export const logDossierGenerated = (companyName) => {
  try {
    console.log('Dossier Generated Event:', {
      company: companyName,
      timestamp: new Date().toISOString()
    });
    // Future: Send to analytics service
    // analytics.track('dossier_generated', { company: companyName });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking dossier views
export const logDossierViewed = (analysis) => {
  try {
    console.log('Dossier Viewed Event:', {
      company: analysis.company_name,
      industry: analysis.industry,
      timestamp: new Date().toISOString()
    });
    // Future: Send to analytics service
    // analytics.track('dossier_viewed', { 
    //   company: analysis.company_name, 
    //   industry: analysis.industry 
    // });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking PDF downloads
export const logPDFDownloaded = (analysis) => {
  try {
    console.log('PDF Downloaded Event:', {
      company: analysis.company_name,
      industry: analysis.industry,
      timestamp: new Date().toISOString()
    });
    // Future: Send to analytics service
    // analytics.track('pdf_downloaded', { 
    //   company: analysis.company_name, 
    //   industry: analysis.industry 
    // });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};

// Analytics utility for tracking data exports
export const logDataExported = (format, recordCount) => {
  try {
    console.log('Data Exported Event:', {
      format: format,
      recordCount: recordCount,
      timestamp: new Date().toISOString()
    });
    // Future: Send to analytics service
    // analytics.track('data_exported', { 
    //   format: format, 
    //   recordCount: recordCount 
    // });
  } catch (error) {
    console.error('Analytics logging failed:', error);
  }
};