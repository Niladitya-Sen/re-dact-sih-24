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
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Trash2 } from 'lucide-react';


const Document = dynamic(() => import('react-pdf').then(module => module.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(module => module.Page), { ssr: false });

type RedactedWord = {
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
    text: string
};

type AIRedactedWord = Omit<RedactedWord, 'pdfBbox'>;


function RedactedOverlay({ word, showRedacted, onRemoveOverlay }: Readonly<{ word: RedactedWord, showRedacted: boolean, onRemoveOverlay: () => void; }>) {
    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <div
                    className={cn('absolute z-20 cursor-pointer', {
                        'preview': !showRedacted,
                        'redacted': showRedacted,
                    })}
                    style={{
                        top: word.bbox.y + "px",
                        left: word.bbox.x + "px",
                        width: word.bbox.width + "px",
                        height: word.bbox.height + "px",
                    }}
                />
            </HoverCardTrigger>
            <HoverCardContent className={cn('w-fit p-2')}>
                <Button size={'icon'} variant={'ghost'} onClick={onRemoveOverlay}>
                    <Trash2 size={20} />
                </Button>
            </HoverCardContent>
        </HoverCard>
    );
}

export default function PDFViewer() {
    const [numPages, setNumPages] = useState(0);
    const pdf = useAppSelector(state => state.pdf);
    const [isRedacting, setIsRedacting] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [showRedacted, setShowRedacted] = useState(true);
    const [redacting, setRedacting] = useState(false);
    const [redactedWords, setRedactedWords] = useState<RedactedWord[]>([]);
    const redactedDoc = useRef<PDFDocument | null>(null);

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
                        const pagePreviewRect = canvas.parentElement!.getBoundingClientRect();

                        // Convert coordinates relative to the canvas and apply scaling
                        const x = (rect.left - canvasRect.left) * scaleX;
                        const y = (canvasRect.height - (rect.bottom - canvasRect.top)) * scaleY; // Flip and scale y coordinate
                        const width = rect.width * scaleX;
                        const height = rect.height * scaleY;

                        setRedactedWords(prev => [...prev, {
                            page: parseInt(selection.anchorNode?.parentElement?.dataset.page!) - 1,
                            text: selectedText,
                            bbox: {
                                x: rect.left - pagePreviewRect.left,
                                y: rect.top - pagePreviewRect.top,
                                width: rect.width,
                                height: rect.height,
                            },
                            pdfBbox: {
                                x,
                                y,
                                width,
                                height
                            }
                        }]);

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

            setRedactedWords(prev => [...prev, ...(data.map(item => {
                const canvas = document.querySelector(`.page-preview[data-page-number="${item.page + 1}"] canvas`) as HTMLCanvasElement;
                const canvasRect = canvas.getBoundingClientRect();
                const pageSize = redactedDoc.current!.getPages()[item.page].getSize();

                const scaleX = canvasRect.width / pageSize.width;
                const scaleY = canvasRect.height / pageSize.height;

                return {
                    text: item.text,
                    page: item.page,
                    bbox: {
                        x: item.bbox.x * scaleX,
                        y: item.bbox.y * scaleY,
                        width: item.bbox.width * scaleX + 6,
                        height: item.bbox.height * scaleY,
                    },
                    pdfBbox: {
                        x: item.bbox.x,
                        y: pageSize.height - item.bbox.y - item.bbox.height,
                        width: item.bbox.width + 6,
                        height: item.bbox.height,
                        color: rgb(0, 0, 0),
                    }
                }
            }))]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const customTextRenderer = (textItem: any) => {
        return `<span data-page="${textItem.pageNumber}" data-itemindex="${textItem.itemIndex}">${textItem.str}</span>`;
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
        if (!pdf.pdf) {
            return;
        }

        try {
            setRedacting(true);
            const buffer = await pdf.pdf.arrayBuffer();
            const doc = await PDFDocument.load(buffer);
            redactedWords.forEach(word => {
                doc.getPages()[word.page].drawRectangle({
                    x: word.pdfBbox.x,
                    y: word.pdfBbox.y,
                    width: word.pdfBbox.width,
                    height: word.pdfBbox.height,
                    color: rgb(0, 0, 0),
                });
            });
            const pdfBytes = await doc.save();
            const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl);
            URL.revokeObjectURL(pdfUrl);
        } catch(error) {
            console.error(error);
        } finally {
            setRedacting(false);
        }
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
                            >
                                {
                                    redactedWords.filter(word => word.page === index).map((word, index) => (
                                        <RedactedOverlay
                                            key={index}
                                            word={word}
                                            showRedacted={showRedacted}
                                            onRemoveOverlay={() => {
                                                setRedactedWords(prev => prev.filter((item) => item !== word));
                                            }}
                                        />
                                    ))
                                }
                            </Page>
                        ))
                    }
                </Document>
            </div>
        </section>
    );
}