"use client";

import type React from "react";

import { useState } from "react";
import { Upload, User, Check, X, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-context";

const mockDonors = [
  {
    id: "D001",
    name: "Ahmed Hassan",
    email: "ahmed@email.com",
    phone: "+33123456789",
  },
  {
    id: "D002",
    name: "Fatima Al-Zahra",
    email: "fatima@email.com",
    phone: "+33987654321",
  },
  {
    id: "D003",
    name: "Omar Benali",
    email: "omar@email.com",
    phone: "+33456789123",
  },
  {
    id: "D004",
    name: "Aisha Kone",
    email: "aisha@email.com",
    phone: "+33789123456",
  },
  {
    id: "D005",
    name: "Youssef Mansouri",
    email: "youssef@email.com",
    phone: "+33321654987",
  },
];

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "success" | "error";
  assignedDonor?: (typeof mockDonors)[0];
}

export function UploadPage() {
  const { t } = useLanguage();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [donorSearch, setDonorSearch] = useState("");

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    const newFiles: UploadedFile[] = files.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      status: "uploading",
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);

    // Simulate upload process
    newFiles.forEach((file) => {
      setTimeout(() => {
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "success" as const } : f
          )
        );
      }, 2000);
    });
  };

  const assignDonor = (fileId: string, donor: (typeof mockDonors)[0]) => {
    setUploadedFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, assignedDonor: donor } : f))
    );
  };

  const filteredDonors = mockDonors.filter(
    (donor) =>
      donor.name.toLowerCase().includes(donorSearch.toLowerCase()) ||
      donor.id.toLowerCase().includes(donorSearch.toLowerCase())
  );

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "uploading":
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
        );
      case "success":
        return <Check className="h-4 w-4 text-green-600" />;
      case "error":
        return <X className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusBadge = (status: UploadedFile["status"]) => {
    const colors = {
      uploading:
        "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700",
      success:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700",
      error:
        "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700",
    };

    return (
      <Badge className={`${colors[status]} rounded-full px-3 py-1 border`}>
        {getStatusIcon(status)}
        <span className="ml-2 capitalize">{status}</span>
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {t("upload.title")}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {t("upload.formats")}
        </p>
      </div>

      {/* Upload Area */}
      <Card className="rounded-2xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
        <CardContent className="p-8">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-2">
              {t("upload.drag")}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {t("upload.formats")}
            </p>
            <Button
              size="lg"
              className="rounded-xl px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <Upload className="mr-2 h-5 w-5" />
              Sélectionner des fichiers
            </Button>
            <input
              id="file-input"
              type="file"
              multiple
              accept="video/*"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFiles(Array.from(e.target.files))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="rounded-2xl border-gray-100 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Fichiers téléchargés ({uploadedFiles.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-100">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {file.size}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(file.status)}
                </div>

                {file.status === "success" && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t("upload.donor.select")}
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <Input
                            placeholder={t("upload.donor.search")}
                            value={donorSearch}
                            onChange={(e) => setDonorSearch(e.target.value)}
                            className="pl-10 rounded-xl border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        {donorSearch && (
                          <div className="mt-2 max-h-40 overflow-y-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm">
                            {filteredDonors.map((donor) => (
                              <button
                                key={donor.id}
                                onClick={() => {
                                  assignDonor(file.id, donor);
                                  setDonorSearch("");
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                              >
                                <div className="flex items-center gap-3">
                                  <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-100">
                                      {donor.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {donor.id} • {donor.email}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {file.assignedDonor && (
                        <div className="bg-white dark:bg-gray-600 rounded-xl p-4 border border-green-200 dark:border-green-700">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-100">
                                {file.assignedDonor.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {file.assignedDonor.id}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        disabled={!file.assignedDonor}
                        className="rounded-xl px-6 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                      >
                        {t("upload.assign")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
