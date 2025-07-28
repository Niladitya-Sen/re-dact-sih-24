"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import Image from "next/image";
import React, { useState } from 'react';
import RedactionLevelDialog from "./redaction-level-dialog";
import { useFiles } from "../context/FilesContext";
import { useRedact } from "../context/RedactContext";
import AddFilesDialog from "../add-files-dialog";

type RedactOptionProps = Readonly<{
    title: string;
    description: string;
    icon: string;
    onClick?: () => void;
}>;

function RedactOption({ title, description, icon, onClick }: RedactOptionProps) {
    return (
        <div
            tabIndex={0}
            className='flex flex-row sm:flex-col gap-6 sm:gap-2 items-center justify-center sm:max-w-[300px] w-full p-4 sm:px-4 sm:py-8 cursor-pointer rounded-lg transition-colors duration-200 hover:bg-neutral-200'
            onClick={onClick}
        >
            <Image src={icon} width={100} height={100} alt="icon" />
            <div className="flex flex-col items-start sm:items-center justify-start sm:justify-center gap-1 sm:gap-2">
                <h3 className='text-base sm:text-xl font-semibold sm:mt-3'>{title}</h3>
                <p className='text-xs sm:text-sm sm:text-center font-[500]'>{description}</p>
            </div>
        </div>
    )
}

export default function AIRedactDialog({ trigger }: Readonly<{ trigger: React.ReactNode }>) {
    const [levelDialogOpen, setLevelDialogOpen] = useState(false);
    const [redactDialogOpen, setRedactDialogOpen] = useState(false);
    const [fileDialogOpen, setFileDialogOpen] = useState(false);
    const files = useFiles();
    const redact = useRedact();

    return (
        <>
            <AddFilesDialog open={fileDialogOpen} onOpenChange={setFileDialogOpen} />
            <RedactionLevelDialog open={levelDialogOpen} onOpenChange={setLevelDialogOpen} />
            <Dialog open={redactDialogOpen} onOpenChange={setRedactDialogOpen}>
                <DialogTrigger onClick={() => { redact.setRedactionType("AI") }} asChild>
                    {trigger}
                </DialogTrigger>
                <DialogContent className={cn('max-w-screen-lg')}>
                    <DialogHeader>
                        <DialogTitle className={cn('text-center text-3xl font-[500]')}>What type of File <span className='text-primary'>would you like to Redact?</span></DialogTitle>
                    </DialogHeader>
                    <div className='flex flex-col sm:flex-row gap-2 items-center justify-center my-8'>
                        <RedactOption
                            title="Doc"
                            description="Ideal for redacting sensitive information from word documents, spreadsheets, and PDFs."
                            icon="/redact/assets/images/doc.png"
                            onClick={() => {
                                setRedactDialogOpen(false);
                                setLevelDialogOpen(true);
                                files.setFileType('application/pdf');
                            }}
                        />
                        <RedactOption
                            title="Image"
                            description="Perfect for redacting sensitive details from image files like .jpg, .png, and .svg etc. "
                            icon="/redact/assets/images/image.png"
                            onClick={() => {
                                setRedactDialogOpen(false);
                                files.setFileType('image/*');
                                setFileDialogOpen(true);
                            }}
                        />
                        <RedactOption
                            title="Video"
                            description="Enables redaction of confidential information within video files like .mp4, .mkv, and .mov etc."
                            icon="/redact/assets/images/video.png"
                            onClick={() => {
                                setRedactDialogOpen(false);
                                files.setFileType('video/*');
                                setFileDialogOpen(true);
                            }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
