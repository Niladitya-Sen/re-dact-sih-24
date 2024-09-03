"use client";

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/redux/hooks/hooks';
import dynamic from 'next/dynamic';
import { PDFDocument, rgb } from 'pdf-lib';
import { useEffect, useRef, useState } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from './ui/button';

const Document = dynamic(() => import('react-pdf').then(module => module.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(module => module.Page), { ssr: false });

type AIRedactedWord = {
    bbox: {
        x: number,
        y: number,
        height: number,
        width: number
    },
    page: number,
    text: string
};

export default function PDFViewer() {
    const [numPages, setNumPages] = useState(0);
    const pdf = useAppSelector(state => state.pdf);
    const [isRedacting, setIsRedacting] = useState(false);
    const [redactedItems, setRedactedItems] = useState<string[]>([]);
    const ref = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [showRedacted, setShowRedacted] = useState(true);
    const redactedElements = useRef<{ pageNumber?: number, itemIndex?: number, text: string }[]>([]);
    const redactedDoc = useRef<PDFDocument | null>(null);
    const [redacting, setRedacting] = useState(false);

    useEffect(() => {
        (async () => {
            if (pdf.pdf) {
                const buffer = await pdf.pdf.arrayBuffer();
                redactedDoc.current = await PDFDocument.load(buffer);
            }
        })()
    }, [pdf.pdf]);

    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdf.worker.min.mjs',
            window.location.origin,
        ).toString();
    }, []);

    useEffect(() => {
        if (ref.current) {
            ref.current.addEventListener('mouseup', handleTextSelection);
        }

        return () => {
            if (ref.current) {
                ref.current.removeEventListener('mouseup', handleTextSelection);
            }
        };
    }, [isRedacting]);

    const handleManualRedact = () => {
        setIsRedacting(prev => !prev);
    };

    const handleTextSelection = async () => {
        if (isRedacting) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const selectedText = selection.toString().trim();
                if (selectedText) {
                    setRedactedItems(prev => [...prev, selectedText]);

                    redactedElements.current.push({
                        pageNumber: parseInt(selection.anchorNode?.parentElement?.dataset.page!),
                        itemIndex: parseInt(selection.anchorNode?.parentElement?.dataset.itemindex!),
                        text: selectedText,
                    });

                    const range = selection.getRangeAt(0);
                    const rect = range.getBoundingClientRect();

                    const page = parseInt(selection.anchorNode?.parentElement?.dataset.page!);
                    const canvas = document.querySelector(`.page-preview[data-page-number="${page}"] canvas`) as HTMLCanvasElement;

                    if (canvas) {
                        const canvasRect = canvas.getBoundingClientRect();

                        const pageSize = redactedDoc.current!.getPages()[page - 1].getSize();

                        // Scale factors to adjust for canvas and PDF page sizes
                        const scaleX = pageSize.width / canvasRect.width;
                        const scaleY = pageSize.height / canvasRect.height;

                        // Convert coordinates relative to the canvas and apply scaling
                        const x = (rect.left - canvasRect.left) * scaleX;
                        const y = (canvasRect.height - (rect.bottom - canvasRect.top)) * scaleY; // Flip and scale y coordinate
                        const width = rect.width * scaleX;
                        const height = rect.height * scaleY;

                        // Draw redaction rectangle on the PDF
                        redactedDoc.current!.getPages()[page - 1].drawRectangle({
                            x,
                            y,
                            width,
                            height,
                            color: rgb(0, 0, 0),
                            borderColor: rgb(0, 0, 0),
                            borderWidth: 1,
                        });

                        // Save the modified PDF document
                        const saved = await redactedDoc.current!.save();

                        redactedDoc.current = await PDFDocument.load(saved);

                        // Clear the selection after redacting
                        selection.removeAllRanges();
                    } else {
                        console.error('Canvas not found for the selected page.');
                    }
                }
            }
        }
    };

    async function handleAIRedact() {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('pdf', pdf.pdf as Blob);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/redact`, {
                method: 'POST',
                body: formData,
            });
            const data: AIRedactedWord[] = await response.json();
            console.log(data);
            setRedactedItems((prev) => [...prev, ...(data.map((text) => text.text))]);
            redactedElements.current.push(...data.map((text) => ({ text: text.text })));
            await redactPDF(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    async function redactPDF(words: AIRedactedWord[]) {
        try {
            setRedacting(true);

            if (!redactedDoc.current) {
                return;
            }

            const pages = redactedDoc.current.getPages();

            for (const word of words) {
                const page = pages[word.page];
                const pageSize = page.getSize();
                const { x, y, width, height } = word.bbox;

                page.drawRectangle({
                    x: x,
                    y: pageSize.height - y - height,
                    width: width,
                    height: height,
                    color: rgb(0, 0, 0),
                });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setRedacting(false);
        }
    }

    const customTextRenderer = (textItem: any) => {
        let renderedText = textItem.str;
        redactedItems.forEach(redactedText => {
            if (renderedText.includes(redactedText)) {
                const redactedReplacement = `<div data-page="${textItem.pageNumber}" data-itemindex="${textItem.itemIndex}" class="${showRedacted ? "redacted" : "preview"}" style="display: inline;"><span style="visibility: hidden; position: relative;">${redactedText}</span></div>`;

                if (redactedElements.current.find(e => e.pageNumber === textItem.pageNumber && e.itemIndex === textItem.itemIndex && e.text === redactedText && typeof e.pageNumber !== 'undefined' && typeof e.itemIndex !== 'undefined')) {
                    renderedText = renderedText.replace(redactedText, redactedReplacement);
                }

                if (redactedElements.current.find(e => e.text === redactedText && typeof e.pageNumber === 'undefined' && typeof e.itemIndex === 'undefined')) {
                    renderedText = renderedText.replace(redactedText, redactedReplacement);
                }
            }
        });

        return `<span data-page="${textItem.pageNumber}" data-itemindex="${textItem.itemIndex}">${renderedText}</span>`;
    };

    async function pdfToOCR(pdf: Blob) {
        const formData = new FormData();
        formData.append('pdf', pdf);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/ocr`, {
            method: 'POST',
            body: formData
        });
        const data: { pdf: string } = await response.json();
        console.log(data);
        return data;
    }

    async function handleDownload() {
        // Open the updated PDF in a new window or replace an existing one
        const pdfBytes = await redactedDoc.current?.save();
        const pdfBlob = new Blob([pdfBytes!], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);

        window.open(pdfUrl);

        // Revoke the Blob URL to avoid memory leaks
        URL.revokeObjectURL(pdfUrl);
    }

    return (
        <section ref={ref} className='w-full min-h-screen flex flex-col justify-center items-center overflow-y-auto relative'>
            <div className='fixed top-4 z-50 bg-white flex gap-4 items-center'>
                <div className='flex gap-2 items-center justify-center'>
                    <Switch
                        checked={showRedacted}
                        onCheckedChange={setShowRedacted}
                    />
                    <p>Redacted</p>
                </div>
                <Button size={"sm"} onClick={handleManualRedact}>
                    {isRedacting ? 'Stop' : 'Start'} Manual Redact
                </Button>
                <Button disabled={loading} size={"sm"} className='gap-2' onClick={handleAIRedact}>
                    {
                        loading && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="white" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.25" />
                            <path fill="white" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
                                <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
                            </path>
                        </svg>
                    }
                    <p>AI Redact</p>
                </Button>

                <Button disabled={redacting} size={"sm"} onClick={handleDownload}>
                    Download
                </Button>
            </div>
            <div className='relative'>
                <Document
                    file={pdf.pdf}
                    onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                    className={cn('flex flex-col gap-8 mb-8 mt-16')}
                >
                    {
                        Array.from({ length: numPages }).fill(0).map((_, index) => (
                            <Page
                                key={index}
                                pageNumber={index + 1}
                                className='border border-[#ccc] page-preview relative'
                                scale={1.5}
                                width={Math.min(600, window.innerWidth * 0.9)}
                                customTextRenderer={customTextRenderer}
                            />
                        ))
                    }
                </Document>
            </div>
        </section>
    );
}