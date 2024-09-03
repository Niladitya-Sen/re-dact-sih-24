"use client";

import React from 'react'
import { Button } from '../ui/button'

export default function SelectRedactionCard({ title, description, onClick }: Readonly<{ title: string, description: string, onClick: () => void }>) {
    return (
        <div className='max-w-[350px] w-full flex flex-col rounded-lg overflow-hidden shadow-md'>
            <div className='w-full bg-blue-900 h-[103px]'></div>
            <div className='flex gap-8 items-center justify-between bg-[#F8EFFF] p-4'>
                <div>
                    <p className='text-base font-[500]'>{title}</p>
                    <p className='text-xs font-normal'>{description}</p>
                </div>
                <Button size={'sm'} onClick={onClick}>Upload</Button>
            </div>
        </div>
    )
}
