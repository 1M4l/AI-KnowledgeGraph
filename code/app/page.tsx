"use client";

import { Upload, MessageSquare, FileText, Database, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { VectorStore } from "@/components/vector-store";

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const steps = [
    { icon: Upload, title: "Upload", description: "Upload files or enter URL" },
    { icon: FileText, title: "Process", description: "Extract and process text" },
    { icon: Database, title: "Store", description: "Create vector embeddings" },
    { icon: Bot, title: "Chat", description: "Ask questions about your data" },
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    setUploadedFiles(Array.from(files));

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'system',
        content: `Successfully processed ${files.length} file(s)`
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'system',
        content: 'Error processing files: ' + (error as Error).message
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error: ' + (error as Error).message
      }]);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
            AI Document Chat
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Upload your documents and chat with them intelligently
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {steps.map((step, index) => (
            <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <step.icon className="w-6 h-6" />
                </div>
                <h2 className="font-semibold">{step.title}</h2>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {step.description}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">File Upload</TabsTrigger>
                <TabsTrigger value="url">Website URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Input
                    type="file"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 mb-4 text-neutral-400" />
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      Drop files here or click to upload
                    </span>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <VectorStore
                    onVectorStored={() => {
                      setMessages(prev => [...prev, {
                        role: 'system',
                        content: 'Vectors stored successfully'
                      }]);
                    }}
                    isProcessing={isProcessing}
                  />
                )}
              </TabsContent>
              <TabsContent value="url">
                <div className="space-y-4">
                  <Input
                    type="url"
                    placeholder="Enter website URL"
                    className="w-full"
                  />
                  <Button className="w-full">Process URL</Button>
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          <Card className="p-6">
            <div className="flex flex-col h-[500px]">
              <ScrollArea className="flex-grow mb-4 p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "mb-4 p-4 rounded-lg",
                      message.role === "user"
                        ? "bg-neutral-100 dark:bg-neutral-800 ml-12"
                        : "bg-neutral-50 dark:bg-neutral-900 mr-12"
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </ScrollArea>
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question about your documents..."
                  className="flex-grow"
                />
                <Button type="submit">Send</Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}