"use client";

import React from 'react'
import SelectRedactionCard from './select-redaction-card'

export default function RedactionJourney() {
    return (
        <div className='bg-white flex-grow rounded-tl-lg p-4 md:p-6'>
            <p className='text-2xl font-semibold text-[#3B3B4F]'>Begin Your Redaction Journey Effortlessly</p>
            <div className='flex flex-wrap gap-6 mt-8'>
                <SelectRedactionCard
                    title='Redact File'
                    description='Protect sensitive information in your documents by quickly redacting text and data'
                    onClick={() => { }}
                />
                <SelectRedactionCard
                    title='Redact Image'
                    description='Quickly blur identities and sensitive information in your images to protect privacy'
                    onClick={() => { }}
                />
                <SelectRedactionCard
                    title='Redact Video'
                    description='Efficiently hide confidential content by redact specific scenes or details in your videos'
                    onClick={() => { }}
                />
            </div>
        </div>
    )
}
