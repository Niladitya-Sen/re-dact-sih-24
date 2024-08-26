"use client";

import { useAppSelector } from '@/redux/hooks/hooks';
import { useState } from 'react';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Switch } from './ui/switch';
import dynamic from 'next/dynamic';

const Document = dynamic(() => import('react-pdf').then(module => module.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(module => module.Page), { ssr: false });

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

export default function PDFViewer() {
    const [numPages, setNumPages] = useState(0);
    const pdf = useAppSelector(state => state.pdf);
    const [showRedacted, setShowRedacted] = useState(false);

    return (
        <section className='w-full min-h-screen flex flex-col justify-center items-center overflow-y-auto relative'>
            <div className='flex gap-2 items-center justify-center absolute top-4'>
                <Switch
                    checked={showRedacted}
                    onCheckedChange={setShowRedacted}
                />
                <p>Redacted</p>
            </div>
            <Document
                file={showRedacted ? `data:application/pdf;base64,${pdf.redacted}` : `data:application/pdf;base64,${pdf.preview}`}
                onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                className={'flex flex-col gap-8 mb-8 mt-16'}
            >
                {
                    Array.from({ length: numPages }).fill(0).map((_, index) => (
                        <Page
                            key={index}
                            pageNumber={index + 1}
                            className='border border-[#ccc]'
                            scale={1.5}
                            width={Math.min(600, window.innerWidth * 0.9)}
                        />
                    ))
                }
            </Document>
        </section>
    )
}
