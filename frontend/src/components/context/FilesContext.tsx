"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';

type FileType = "application/pdf" | "image/*" | "video/*";

type FilesContextType = {
    fileType: FileType;
    files: File[];
    currentFileIndex: number;
    setCurrentFileIndex: (index: number) => void;
    setFileType: (fileType: FileType) => void;
    setFiles: (files: File[]) => void;
}

const FilesContext = createContext<FilesContextType | null>(null);

export const useFiles = () => {
    const context = useContext(FilesContext);

    if (!context) {
        throw new Error('useFiles must be used within a FilesContextProvider');
    }

    return context;
}

export default function FilesContextProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [fileType, setFileType] = useState<FileType>('application/pdf');
    const [files, setFiles] = useState<File[]>([]);
    const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);

    const values = useMemo(() => ({
        fileType,
        files,
        currentFileIndex,
        setCurrentFileIndex,
        setFileType,
        setFiles,
    }), [fileType, files, currentFileIndex]);

    return (
        <FilesContext.Provider value={values}>
            {children}
        </FilesContext.Provider>
    )
}