"use client";

import dynamic from 'next/dynamic';
import React from 'react'

const PDFViewer = dynamic(() => import('@/components/pdf-viewer'), { ssr: false });

export default function Redact() {
    return (
        <main>
            <PDFViewer />
        </main>
    )
}
