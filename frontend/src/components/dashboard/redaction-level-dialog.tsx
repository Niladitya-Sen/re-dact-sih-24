"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Level } from "@/enums/enums";
import { cn } from '@/lib/utils';
import { useState } from "react";
import AddFilesDialog from "../add-files-dialog";
import { useRedact } from "../context/RedactContext";
import { Button, buttonVariants } from "../ui/button";

type RedactLevelProps = Readonly<{
    level: Level;
    items: string[];
    onSelect?: (level: Level) => void;
}>;

function RedactLevel({ level, items, onSelect }: RedactLevelProps) {
    return (
        <div className='flex flex-row sm:flex-col gap-6 sm:gap-2 items-center justify-center sm:max-w-[300px] w-full p-4 sm:px-4 sm:py-8 rounded-lg bg-[#f8f8f9] h-full'>
            <p
                className={cn(
                    buttonVariants({
                        size: 'sm',
                    }),
                    {
                        'bg-green-600 hover:bg-green-600': level === Level.LOW,
                        'bg-yellow-600 hover:bg-yellow-600': level === Level.MEDIUM,
                        'bg-red-600 hover:bg-red-600': level === Level.HIGH,
                    }
                )}
            >{level}</p>
            <div className="flex flex-wrap gap-2 items-center justify-center mt-4">
                {items.map((item, index) => (
                    <span
                        key={index}
                        title={item}
                        className={cn(
                            buttonVariants({
                                size: 'sm',
                                variant: 'secondary',
                            }),
                            "bg-[#e2e2e4] hover:bg-[#cbcbcd]",
                            {
                                "bg-[#cfd3d7] hover:bg-[#cfd3d7]": item === Level.LOW || item === Level.MEDIUM,
                            }
                        )}
                    >
                        {item}
                    </span>
                ))}
            </div>
            <div className="flex-grow"></div>
            <Button className="mt-4" onClick={() => onSelect?.(level)}>Select</Button>
        </div>
    )
}

export default function RedactionLevelDialog({ open, onOpenChange }: Readonly<{ open: boolean; onOpenChange: (open: boolean) => void; }>) {
    const [fileDialogOpen, setFileDialogOpen] = useState(false);
    const redact = useRedact();

    function handleRedactLevelSelect(level: Level) { 
        redact.setRedactionLevel(level);
        setFileDialogOpen(true);
        onOpenChange(false);
    }

    const levels = [
        {
            level: Level.LOW,
            items: ['Dates & Times', 'Names', 'Genders', 'Phone Numbers', 'Emails', 'Addressess', 'Account Numbers', 'IDs', 'Ages']
        },
        {
            level: Level.MEDIUM,
            items: ['Low', 'Amounts', 'Company Names', 'Zip Codes', 'Signatures', 'Logos', 'Races', 'SSNs', 'Credit Cards']
        },
        {
            level: Level.HIGH,
            items: ['Low', 'Medium', 'Links', 'IPs', 'Codes and API key', 'Coordinates', 'IDs', 'Ages']
        }
    ]

    return (
        <>
            <AddFilesDialog open={fileDialogOpen} onOpenChange={setFileDialogOpen} />
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className={cn('max-w-screen-lg')}>
                    <DialogHeader>
                        <DialogTitle className={cn('text-center text-3xl font-[500]')}>Choose the Level of <span className='text-primary'>Redaction?</span></DialogTitle>
                    </DialogHeader>
                    <div className='flex flex-col sm:flex-row gap-2 items-start justify-center my-8'>
                        {
                            levels.map((level, index) => (
                                <RedactLevel
                                    key={index}
                                    {...level}
                                    onSelect={handleRedactLevelSelect}
                                />
                            ))
                        }
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
