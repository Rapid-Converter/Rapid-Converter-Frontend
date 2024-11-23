"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Download, Moon, Sun, Upload } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import axios from "axios";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Toast } from "@/components/ui/toast";

interface PDF {
  name: string;
  url: string;
}

export default function DocToPDFConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [showEncryptionDialog, setShowEncryptionDialog] = useState(false);
  const [encryptPDF, setEncryptPDF] = useState(false);
  const [password, setPassword] = useState("");
  const { theme, setTheme } = useTheme();

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://13.49.0.167:8000";

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    multiple: false,
  });

  const fetchPdfs = async () => {
    try {
      console.log("*************************************");
      const response = await axios.get(`${API_BASE_URL}/list-pdfs`);
      setPdfs(response.data.pdfs || []);
      // console.log("****", pdfs);
    } catch (error) {
      console.error("Error fetching PDFs:", error);
      Toast({
        title: "Failed to fetch PDFs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  // useEffect(() => {
  //   console.log("****", pdfs);
  // }, [pdfs]);

  const handleConvert = async () => {
    if (!file) {
      Toast({
        title: "No file selected",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("encryption", encryptPDF.toString());
    if (encryptPDF) {
      formData.append("password", password);
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/convert`, formData, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        encryptPDF ? `encrypted_${file.name}.pdf` : `${file.name}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      fetchPdfs();

      Toast({
        title: "Conversion successful",
      });
    } catch (error) {
      console.error("Error converting file:", error);
      Toast({
        title: "Conversion failed",
        variant: "destructive",
      });
    }
    setShowEncryptionDialog(false);
  };

  const handleDownload = async (pdf: PDF) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${pdf.url}`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", pdf.name);
      document.body.appendChild(link);
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      Toast({
        title: "Download failed",
        variant: "destructive",
      });
    }
  };

  const lastPdf = pdfs.length > 0 ? pdfs[pdfs.length - 1] : null;
  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8 py-4 border-b">
        <h1 className="text-2xl font-bold">Rapid Converter</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Upload your DOCX file</CardTitle>
          <CardDescription>
            Drag and drop your file or click to select
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
              isDragActive ? "border-primary" : "border-muted-foreground"
            }`}
          >
            <input {...getInputProps()} />
            {file ? (
              <p>{file.name}</p>
            ) : (
              <div>
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p>
                  Drag &apos;n&apos; drop a DOCX file here, or click to select a
                  file
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setShowEncryptionDialog(true)}
            className="w-full"
          >
            Convert to PDF
          </Button>
        </CardFooter>
      </Card>

      <h2 className="text-2xl font-semibold mt-12 mb-4">Generated PDFs</h2>
      <div className="space-y-4">
        {/* <Card key={pdfs.name} className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 text-primary p-2 rounded">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-medium">{pdfs.name}</h3>
              <p className="text-sm text-muted-foreground">PDF Document</p>
            </div>
          </div>
          <Button
            onClick={() => handleDownload(pdfs)}
            size="sm"
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </Card> */}
        {lastPdf ? (
          <Card className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 text-primary p-2 rounded">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-medium">{lastPdf.name}</h3>
                <p className="text-sm text-muted-foreground">PDF Document</p>
              </div>
            </div>
            <Button
              onClick={() => handleDownload(lastPdf)}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
          </Card>
        ) : (
          <p>No PDFs generated yet.</p>
        )}
      </div>

      <Dialog
        open={showEncryptionDialog}
        onOpenChange={setShowEncryptionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encrypt PDF</DialogTitle>
            <DialogDescription>
              Do you want to encrypt the generated PDF?
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Switch
              id="encrypt-pdf"
              checked={encryptPDF}
              onCheckedChange={setEncryptPDF}
            />
            <Label htmlFor="encrypt-pdf">Encrypt PDF</Label>
          </div>
          {encryptPDF && (
            <div className="space-y-2 mt-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password"
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEncryptionDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleConvert}>Convert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
