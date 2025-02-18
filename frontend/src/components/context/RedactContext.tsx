"use client";

import { Level } from "@/enums/enums";
import { PDFDocument } from "pdf-lib";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import zip from 'jszip';
import { useFiles } from "./FilesContext";

export type RedactedWord = {
    bbox: {
        x: number,
        y: number,
        height: number,
        width: number
    },
    pdfBbox: {
        x: number,
        y: number,
        height: number,
        width: number
    },
    page: number,
    text: string,
    category?: string,
    show: boolean,
    resizable?: boolean
};

type AIRedactedWord = Omit<RedactedWord, 'pdfBbox'>;

type RedactContextType = {
    file: Blob | null;
    words: RedactedWord[];
    isAIRedacting: boolean;
    isDownloading: boolean;
    redactionLevel: Level;
    redactionType: "AI" | "Manual";
    redactedDoc: PDFDocument | null;
    categories: string[];
    aiRedactFile: (file_?: Blob) => Promise<Uint8Array | undefined>;
    setRedactionType: (type: "AI" | "Manual") => void;
    setFile: (file: Blob) => Promise<void>;
    setWords: React.Dispatch<React.SetStateAction<RedactedWord[]>>
    aiRedact: (file_?: Blob) => Promise<void>;
    setRedactionLevel: (level: Level) => void;
    downloadRedactedDocument: (password?: string) => Promise<void>;
}

const RedactContext = createContext<RedactContextType | null>(null);

export const useRedact = () => {
    const context = useContext(RedactContext);

    if (!context) {
        throw new Error('useRedact must be used within a RedactContextProvider');
    }

    return context;
};

export default function RedactContextProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [words, setWords] = useState<RedactedWord[]>([]);
    const [isRedacting, setIsRedacting] = useState<boolean>(false);
    const [redactionLevel, setRedactionLevel] = useState<Level>(Level.LOW);
    const [loading, setLoading] = useState<boolean>(false);
    const [file, setFile] = useState<Blob | null>(null);
    const redactedDoc = useRef<PDFDocument | null>(null);
    const [redactionType, setRedactionType] = useState<"AI" | "Manual">("AI");
    const [categories, setCategories] = useState<string[]>([]);
    const { files, currentFileIndex } = useFiles();
    const currentFile = files[currentFileIndex];

    useEffect(() => {
        setWords([]);
        setCategories([]);
    }, [currentFile]);

    async function setFile_(file: Blob) {
        if (!file) return;

        setFile(file);
        const buffer = await file.arrayBuffer();
        redactedDoc.current = await PDFDocument.load(buffer);
    };

    async function aiRedact() {
        setLoading(true);
        try {
            if (!file) {
                console.log('No file selected');
                return;
            }
            const formData = new FormData();
            formData.append('pdf', file);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/redact`, {
                method: 'POST',
                body: formData,
            });
            const data: AIRedactedWord[] = await response.json();
            console.log(data);
            const categories = data.reduce<string[]>((acc, item) => {
                if (item.category && !acc.includes(item.category)) {
                    acc.push(item.category);
                }

                return acc;
            }, []);
            console.log(categories);
            setCategories(categories);
            setWords(prev => [...prev, ...(data.map(item => {
                const canvas = document.querySelector(`.page-preview[data-page-number="${item.page + 1}"] canvas`) as HTMLCanvasElement;
                const canvasRect = canvas.getBoundingClientRect();
                const pageSize = redactedDoc.current!.getPages()[item.page].getSize();

                const scaleX = canvasRect.width / pageSize.width;
                const scaleY = canvasRect.height / pageSize.height;

                return {
                    text: item.text,
                    page: item.page,
                    category: item.category,
                    bbox: {
                        x: item.bbox.x * scaleX,
                        y: item.bbox.y * scaleY,
                        width: item.bbox.width * scaleX + 6,
                        height: item.bbox.height * scaleY,
                    },
                    pdfBbox: {
                        x: item.bbox.x,
                        y: /* pageSize.height - */ item.bbox.y /* - item.bbox.height */,
                        width: item.bbox.width,
                        height: item.bbox.height,
                    },
                    show: true
                }
            }))]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function aiRedactFile(file?: Blob) {
        if (!file) {
            return;
        }

        let url;

        if (file.type.includes('image')) {
            url = `${process.env.NEXT_PUBLIC_API_URL}/redact-image`;
        } else if (file.type.includes('video')) {
            url = `${process.env.NEXT_PUBLIC_API_URL}/redact-video`;
        } else {
            url = `${process.env.NEXT_PUBLIC_API_URL}/redact`;
        }

        const formData = new FormData();

        if (file.type.includes('image')) {
            formData.append('image', file);
        } else if (file.type.includes('pdf')) {
            formData.append('pdf', file);
            formData.append('level', redactionLevel);
        } else {
            formData.append('video', file);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData,
        });

        if (file.type.includes('pdf')) {
            const data: AIRedactedWord[] = await response.json();

            console.log(data);

            const pdfRects = data.map(item => ({
                page: item.page,
                pdfBbox: item.bbox,
                text: item.text,
                category: item.category
            }));

            formData.append('words', JSON.stringify(pdfRects));

            const response_ = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/redact-pdf`, {
                method: 'POST',
                body: formData
            });
            const data_ = await response_.json();
            const base64 = data_.pdf;
            const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
            return buffer;
        }

        const data = await response.json();
        let base64;

        if (file.type.includes('image')) {
            base64 = data.image;
        } else {
            base64 = data.video;
        }

        const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        return buffer;
    }

    async function downloadRedactedDocument(password?: string) {
        if (!file) {
            return;
        }

        try {
            setIsRedacting(true);

            const formData = new FormData();
            formData.append('pdf', file);
            formData.append('words', JSON.stringify(words));

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/redact-pdf`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            const base64 = data.pdf;
            const buffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

            /* const formDataZ = new FormData();
            formDataZ.append('files', new Blob([buffer], { type: 'application/pdf' }));

            if (password) {
                formDataZ.append("password", password);
            }

            const zipRequest = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zip`, {
                method: 'POST',
                body: formDataZ
            });

            const dataZ = await zipRequest.json();
            console.log(dataZ);

            const zipBuffer = Uint8Array.from(atob(dataZ.zip_base64), c => c.charCodeAt(0));

            const url = URL.createObjectURL(new Blob([zipBuffer], {
                type: 'application/zip'
            }));
            window.open(url); */

            const zip_ = new zip();
            const folder = zip_.folder("redacted-files");
            folder?.file(currentFile.name, buffer);
            const blob = await folder?.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob!);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'redacted-files.zip';
            a.click();
            a.remove();

        } catch (error) {
            console.error(error);
        } finally {
            setIsRedacting(false);
        }
    }

    const values = useMemo<RedactContextType>(() => ({
        words,
        isAIRedacting: loading,
        isDownloading: isRedacting,
        redactionType,
        categories,
        aiRedact,
        aiRedactFile,
        redactionLevel,
        file,
        redactedDoc: redactedDoc.current,
        setRedactionType,
        setFile: setFile_,
        setWords,
        setRedactionLevel,
        downloadRedactedDocument
    }), [
        words,
        loading,
        isRedacting,
        redactionType,
        categories,
        aiRedact,
        aiRedactFile,
        redactionLevel,
        file,
        redactedDoc.current,
        setRedactionType,
        setFile_,
        setWords,
        setRedactionLevel,
        downloadRedactedDocument        
    ]);

    return (
        <RedactContext.Provider value={values} >
            {children}
        </RedactContext.Provider>
    )
}