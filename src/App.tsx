import React, { useState, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Card, CardContent } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Button } from "./components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";

const App: React.FC = () => {
  const [industry, setIndustry] = useState<string>('VPS hosting');
  const [emailContext, setEmailContext] = useState<string>('New year is coming, 5% off for all VPS for one month');
  const [goals, setGoals] = useState<string>('More clicks on CTA');
  const [generatedEmail, setGeneratedEmail] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const validFiles = newFiles.filter(file => {
        const isValidType = ['text/plain', 'application/pdf'].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        if (!isValidType) {
          setErrorMessage(`Invalid file type: ${file.name}. Please upload only .txt or .pdf files.`);
        }
        if (!isValidSize) {
          setErrorMessage(`File too large: ${file.name}. Please upload files smaller than 5MB.`);
        }
        return isValidType && isValidSize;
      });
      setFiles(prevFiles => [...prevFiles, ...validFiles]);
    }
  }, []);

  const generateEmail = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const fileContents = await Promise.all(
        files.map(file => file.text())
      );

      const response = await fetch('/api/generate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          industry,
          emailContext,
          goals,
          fileContents,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedEmail(data.generatedEmail);
    } catch (error) {
      console.error('Error generating email:', error);
      setErrorMessage('An error occurred while generating the email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardContent>
          <h1 className="text-2xl font-bold mb-4">Email Optimization AI</h1>
          
          <div className="mb-4">
            <Label htmlFor="industry">Industry</Label>
            <Select onValueChange={setIndustry} defaultValue={industry}>
              <SelectTrigger>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VPS hosting">VPS hosting</SelectItem>
                <SelectItem value="E-commerce">E-commerce</SelectItem>
                <SelectItem value="SaaS">SaaS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="emailContext">Email Context</Label>
            <Input
              id="emailContext"
              value={emailContext}
              onChange={(e) => setEmailContext(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="goals">Goals and Metrics</Label>
            <Input
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="fileUpload">Upload Reference Files</Label>
            <Input
              id="fileUpload"
              type="file"
              multiple
              onChange={handleFileUpload}
              accept=".txt,.pdf"
            />
            {files.length > 0 && (
              <p className="mt-2">Uploaded files: {files.map(f => f.name).join(', ')}</p>
            )}
          </div>

          {errorMessage && (
            <p className="text-red-500 mb-4">{errorMessage}</p>
          )}

          <Button onClick={generateEmail} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Optimized Email'}
          </Button>

          {generatedEmail && (
            <div className="mt-4">
              <h2 className="text-xl font-bold mb-2">Generated Email</h2>
              <ReactQuill value={generatedEmail} readOnly={true} theme="snow" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default App;