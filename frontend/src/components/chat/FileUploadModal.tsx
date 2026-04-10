"use client";

import { useState, useRef, type FormEvent } from "react";

interface FileUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: File[]) => Promise<void>;
    isLoading?: boolean;
}

export function FileUploadModal({ isOpen, onClose, onUpload, isLoading }: FileUploadModalProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles(prev => [...prev, ...droppedFiles]);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles(prev => [...prev, ...selectedFiles]);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;

        try {
            await onUpload(files);
            setFiles([]);
            onClose();
        } catch (error) {
            console.error("Upload failed:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1f] rounded-2xl border border-gray-800/50 w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/50">
                    <h2 className="text-lg font-semibold text-white">Share Files</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-300 transition"
                        disabled={isLoading}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Drag and Drop Area */}
                    <div
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition ${
                            isDragging
                                ? "border-violet-500 bg-violet-500/5"
                                : "border-gray-700/50 hover:border-gray-600"
                        }`}
                    >
                        <svg className="w-10 h-10 mx-auto mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-400 mb-2">
                            Drag and drop files here or{" "}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-violet-400 hover:text-violet-300 font-medium transition"
                                disabled={isLoading}
                            >
                                browse
                            </button>
                        </p>
                        <p className="text-xs text-gray-500">Supports images, videos, and documents</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isLoading}
                        />
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-4">
                            <p className="text-xs font-medium text-gray-400 mb-2">
                                {files.length} file{files.length !== 1 ? "s" : ""} selected
                            </p>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between bg-[#0d0d0f] p-3 rounded-lg">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-gray-300 truncate">{file.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(index)}
                                            className="text-gray-500 hover:text-red-400 transition ml-2 flex-shrink-0 p-1"
                                            disabled={isLoading}
                                        >
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={files.length === 0 || isLoading}
                    >
                        {isLoading ? "Uploading..." : "Upload Files"}
                    </button>
                </div>
            </div>
        </div>
    );
}
