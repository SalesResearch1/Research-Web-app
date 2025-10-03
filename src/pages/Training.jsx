import React, { useState, useEffect } from 'react';
import { TrainingDocument } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, HelpCircle, Sparkles, AlertTriangle, Upload, FileText, Download, Trash2 } from 'lucide-react';
import { InvokeLLM, UploadFile } from '@/api/integrations';
import { User } from '@/api/entities';
import ReactMarkdown from 'react-markdown';
import { logTrainingQuery, logTrainingDocumentViewed } from '@/components/utils/analytics';

const TrainingResponse = ({ answer }) => {
    if (!answer) return null;

    return (
        <div className="mt-6 p-4 sm:p-6 bg-slate-100 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                AI-Generated Answer
            </h3>
            <div className="prose prose-slate max-w-none prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-a:text-primary-600 prose-strong:text-slate-800">
                <ReactMarkdown>
                    {answer}
                </ReactMarkdown>
            </div>
        </div>
    );
};

const DocumentUploadForm = ({ onDocumentUploaded }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!title.trim() || !file) {
            setError('Please provide a title and select a PDF file.');
            return;
        }

        if (file.type !== 'application/pdf') {
            setError('Please select a PDF file only.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // Upload the file
            const { file_url } = await UploadFile({ file });
            
            // Save document metadata
            await TrainingDocument.create({
                title: title.trim(),
                description: description.trim() || '',
                file_url,
                file_name: file.name,
                upload_date: new Date().toISOString()
            });

            // Reset form
            setTitle('');
            setDescription('');
            setFile(null);
            document.getElementById('pdf-file').value = '';
            
            onDocumentUploaded();
            alert('Document uploaded successfully!');
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload document. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader>
                <CardTitle>Upload Training Document</CardTitle>
                <CardDescription>
                    Add a PDF document to the training library (Admin only)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="doc-title">Document Title</Label>
                        <Input
                            id="doc-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., How to Generate Reports"
                            disabled={isUploading}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="doc-description">Description (Optional)</Label>
                        <Textarea
                            id="doc-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this document covers..."
                            rows={2}
                            disabled={isUploading}
                        />
                    </div>
                    
                    <div>
                        <Label htmlFor="pdf-file">PDF File</Label>
                        <Input
                            id="pdf-file"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            disabled={isUploading}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <Button 
                        type="submit" 
                        disabled={isUploading || !title.trim() || !file}
                        className="w-full"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload Document
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

const DocumentsList = ({ documents, isAdmin, onDelete }) => {
    const handleViewDocument = (doc) => {
        // Log the document view
        logTrainingDocumentViewed(doc.title, doc.id);
        
        // Open the document
        window.open(doc.file_url, '_blank');
    };

    const handleDelete = async (doc) => {
        if (!confirm(`Are you sure you want to delete "${doc.title}"? This action cannot be undone.`)) {
            return;
        }
        await onDelete(doc.id);
    };

    return (
        <div className="space-y-4">
            {documents.length === 0 ? (
                <Card className="bg-white shadow-sm border-slate-200">
                    <CardContent className="p-8 text-center">
                        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Documents Available</h3>
                        <p className="text-slate-600">Training documents will appear here once uploaded.</p>
                    </CardContent>
                </Card>
            ) : (
                documents.map((doc) => (
                    <Card key={doc.id} className="bg-white shadow-sm border-slate-200">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                                    </div>
                                    {doc.description && (
                                        <p className="text-slate-600 mb-3 text-sm">{doc.description}</p>
                                    )}
                                    <div className="text-sm text-slate-500">
                                        <span>File: {doc.file_name}</span> • 
                                        <span className="ml-1">
                                            Uploaded {new Date(doc.upload_date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <Button
                                        onClick={() => handleViewDocument(doc)}
                                        size="sm"
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        View/Download
                                    </Button>
                                    {isAdmin && (
                                        <Button
                                            onClick={() => handleDelete(doc)}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}
        </div>
    );
};

export default function Training() {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [documents, setDocuments] = useState([]);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch user data first to determine admin status
                const currentUser = await User.me().catch(() => null);
                setUser(currentUser);

                // Then fetch documents
                const docs = await TrainingDocument.list('-upload_date');
                setDocuments(docs || []);
            } catch (error) {
                console.error('Error loading data:', error);
                setDocuments([]);
            } finally {
                setIsLoadingDocs(false);
            }
        };
        loadData();
    }, []);

    const loadDocuments = async () => {
        try {
            const docs = await TrainingDocument.list('-upload_date');
            setDocuments(docs || []);
        } catch (error) {
            console.error('Error loading documents:', error);
        }
    };

    const handleDeleteDocument = async (documentId) => {
        try {
            await TrainingDocument.delete(documentId);
            await loadDocuments(); // Reload the list
        } catch (error) {
            console.error('Error deleting document:', error);
            alert('Failed to delete document. Please try again.');
        }
    };

    const buildPrompt = (userQuery) => {
        return `You are "Insight Assistant," the friendly and knowledgeable AI help guide for the "EHS Insight Sales Intelligence Tool".

Your goal is to provide clear, helpful, and accurate training content for the sales team using this application.

**Your Audience & Tone:**
- Your audience is the sales team. Speak to them directly in a supportive and professional tone.
- Use clear, non-technical language. Avoid jargon.
- When explaining features, briefly touch on *why* it's useful for a salesperson (e.g., how it helps them find leads, prepare for meetings, or close deals).
- You MUST format your responses in clean Markdown.

Here is a detailed description of the application's features. Use this information as the SOLE source of truth for your answers:

**Application Overview:**
The "EHS Insight Sales Intelligence Tool" is a web application designed to help sales teams research potential clients in the Environmental, Health, and Safety (EHS) sector. It uses AI to generate comprehensive business intelligence dossiers and provides tools for regulatory research and safety calculations.

**Key Features:**

1.  **Dashboard:** The main landing page showing a summary of recent activity and key metrics, like the total number of analyses performed.

2.  **Safety Analyses Page:**
    *   **AI Dossier Generation:** Users can enter a company name to generate a detailed "EHS/ESG Dossier". The AI searches the internet for information.
    *   **Analysis History:** This page lists all previously generated dossiers. Users can search by company name or filter by industry.
    *   **Dossier Contents:** Each dossier contains sections like Executive Summary, Sales Intelligence (pain points, opportunities), Company Profile, EHS Performance, Environmental & ESG Profile, Competitive Analysis, and Saved Regulatory Searches.

3.  **Regulatory Search Page:**
    *   **Function:** Allows users to search for a company across multiple external regulatory databases simultaneously (Violation Tracker, OSHA Establishment Search, EPA ECHO).
    *   **Saving Searches:** Users can optionally select a dossier from a dropdown list to save the search link directly into that dossier for future reference.

4.  **Calculators Page:**
    *   **TRIR Calculator:** A tool to calculate a company's Total Recordable Incident Rate. This helps quantify a prospect's safety performance, which can be a powerful data point in a sales pitch.
    *   **OSHA Safety Pays Calculator:** A tool to estimate the financial impact of workplace injuries, turning safety issues into a clear business cost that you can solve.
    *   **Saving Calculations:** Results from both calculators can be saved to a selected dossier.

5.  **Training & Help Page (This Page):**
    *   The page you are on now. You generate answers to user questions about how to use the app.

6.  **Admin-Only Features (Data Import & Imported Data Viewer):**
    *   These pages are for system administrators to upload and manage internal company data. If asked, explain that these are for system administrators and are not part of the standard sales user workflow.

**Your Task:**
A salesperson has asked the following question: "${userQuery}"

Please provide a helpful and clear answer based on their question.
- For "how-to" questions, provide simple, numbered step-by-step instructions.
- For "what is" questions, provide a clear explanation and its relevance to a sales role.
- For "FAQ" requests, generate common questions and answers that a salesperson would have.
- ALWAYS stick to the features described above. Do not invent features or capabilities.`;
    };

    const handleGenerate = async () => {
        if (!query.trim()) {
            setError('Please enter a question.');
            return;
        }

        setIsLoading(true);
        setError('');
        setAnswer('');

        try {
            const prompt = buildPrompt(query);
            const response = await InvokeLLM({ prompt });
            setAnswer(response);
            
            // Log the training query
            logTrainingQuery(query, response.length);
            
        } catch (err) {
            console.error("Error generating training:", err);
            setError("Sorry, there was an error generating the training content. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleExampleClick = (exampleQuery) => {
        setQuery(exampleQuery);
    };

    const isAdmin = user?.role === 'admin';

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="p-4 sm:p-8 max-w-4xl mx-auto">
                <div className="mb-6 sm:mb-8 text-center">
                    <HelpCircle className="w-12 h-12 text-primary-600 mx-auto mb-4" />
                    <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 mb-2">Training & Help Center</h1>
                    <p className="text-slate-600 text-sm sm:text-lg">
                        Get help with the app or browse training documents.
                    </p>
                </div>

                <Tabs defaultValue="ai-help" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="ai-help">AI Help</TabsTrigger>
                        <TabsTrigger value="documents">Training Documents</TabsTrigger>
                    </TabsList>

                    <TabsContent value="ai-help">
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle>Ask a Question</CardTitle>
                                <CardDescription>
                                    What would you like to know? For example: "How do I use the TRIR calculator?" or "What are sales pain points?"
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    placeholder="Type your question here..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    rows={4}
                                    className="text-base"
                                    disabled={isLoading}
                                />
                                <div className="text-xs text-slate-500 mt-2">
                                    Examples:
                                    <Button variant="link" size="sm" className="text-xs h-auto p-0 ml-1" onClick={() => handleExampleClick("How do I generate a report?")}>How do I generate a report?</Button>,
                                    <Button variant="link" size="sm" className="text-xs h-auto p-0 ml-1" onClick={() => handleExampleClick("Explain the Regulatory Search page.")}>Explain Regulatory Search</Button>,
                                    <Button variant="link" size="sm" className="text-xs h-auto p-0 ml-1" onClick={() => handleExampleClick("Give me some FAQs about dossiers.")}>FAQs about dossiers</Button>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleGenerate} disabled={isLoading || !query.trim()}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Guide'
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <TrainingResponse answer={answer} />
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6">
                        {isAdmin && (
                            <DocumentUploadForm onDocumentUploaded={loadDocuments} />
                        )}
                        
                        <Card className="bg-white shadow-sm border-slate-200">
                            <CardHeader>
                                <CardTitle>Training Documents</CardTitle>
                                <CardDescription>
                                    Download and view training materials and guides.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingDocs ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                                        <span className="ml-2 text-slate-600">Loading documents...</span>
                                    </div>
                                ) : (
                                    <DocumentsList 
                                        documents={documents} 
                                        isAdmin={isAdmin}
                                        onDelete={handleDeleteDocument}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}