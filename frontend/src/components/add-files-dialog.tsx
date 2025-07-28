"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import zip from 'jszip';
import { FolderOpen } from 'lucide-react';
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from 'react';
import { IoIosCloseCircle, IoMdInformationCircle } from "react-icons/io";
import { useFiles } from './context/FilesContext';
import { useRedact } from "./context/RedactContext";
import { Button } from './ui/button';
import { useLoader } from "./context/LoadingContext";

type FilesDialogProps = Readonly<{
    trigger: React.ReactNode;
} | {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}>;

function DialogContent_() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { fileType, files, setFiles } = useFiles();
    const { redactionType, aiRedactFile } = useRedact();
    const [error, setError] = useState<boolean>(false);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const loader = useLoader();

    async function handleUpload() {
        console.log(redactionType);
        if (redactionType === "AI") {
            try {
                setLoading(true);
                loader.show("Please wait while we redact your files");
                const res = await Promise.all(files.map(async (file) => await aiRedactFile(file)));
                const zip_ = new zip();
                const folder = zip_.folder("redacted-files"); 
                res.forEach((file, index) => {
                    if (file) {
                        const name = files[index].name;
                        const dot = files[index].name.lastIndexOf(".");
                        folder?.file(name.substring(0, dot) + "-redacted" + name.substring(dot), file);
                    }
                });
                const blob = await folder?.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(blob!);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'redacted-files.zip';
                a.click();
                a.remove();
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
                loader.hide();
            }
            
            return;
        }

        router.push('/workspace');
    }

    return (
        <DialogContent className={cn('max-w-screen-lg')}>
            <DialogHeader>
                <DialogTitle>Add Files</DialogTitle>
            </DialogHeader>
            <div className='flex gap-4 items-center h-[140px]'>
                {
                    files.map((file, index) => (
                        <div key={index} className='bg-secondary w-fit p-4 rounded-md cursor-pointer relative'>
                            <div className="absolute inset-0 z-10 transition-opacity duration-200 opacity-0 hover:opacity-100">
                                <button
                                    className="absolute -top-2 -right-2 bg-white rounded-full p-1"
                                    onClick={() => setFiles(files.filter((_, i) => i !== index))}
                                >
                                    <IoIosCloseCircle size={30} className="transition-colors duration-200 hover:text-red-500" />
                                </button>
                            </div>
                            {
                                file.type.includes('pdf') && (
                                    <Image
                                        src="/redact/assets/images/pdf.svg"
                                        alt="file"
                                        width={80}
                                        height={80}
                                    />
                                )
                            }
                            {
                                file.type.includes('image') && (
                                    <Image
                                        src="/redact/assets/images/image-icon.png"
                                        alt="file"
                                        width={80}
                                        height={80}
                                    />
                                )
                            }
                            {
                                file.type.includes('video') && (
                                    <Image
                                        src="/redact/assets/images/video-icon.png"
                                        alt="file"
                                        width={80}
                                        height={80}
                                    />
                                )
                            }
                            <p className='text-xs mt-2 font-[500]'>{(file.name.length >= 5 ? file.name.substring(0, 5) + "..." : file.name) + " ." + file.type.split("/")[1]}</p>
                        </div>
                    ))
                }
                <div className='flex-grow'></div>
                <Button disabled={loading} className='self-start' onClick={handleUpload}>
                    Upload
                </Button>
            </div>
            <div>
                <label htmlFor="fileInput" className='flex flex-col gap-4 items-center justify-center bg-gray-200 rounded-md p-4 h-[300px] relative cursor-pointer'>
                    <p className='font-[500] text-xl mb-4'>Drop files here, <span className="text-primary">browse files</span> or import</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={fileType}
                        id="fileInput"
                        className='w-full h-full absolute inset-0 invisible'
                        onChange={(e) => {
                            if (files.length + 1 > 5) {
                                setError(true);
                                setTimeout(() => setError(false), 3000);
                                return;
                            }

                            const files_ = e.target?.files;
                            if (files_ && files_.length > 0) {
                                setFiles([...files, ...Array.from(files_)]);
                            }
                        }}
                    />

                    <div className='flex gap-4'>
                        <Button
                            size={"sm"}
                            variant={"secondary"}
                            className={cn('flex-col gap-2 w-[90px] h-[90px] z-20')}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <FolderOpen size={30} />
                            <span className='text-xs'>My Device</span>
                        </Button>
                        <Button
                            size={"sm"}
                            variant={"secondary"}
                            className={cn('flex-col gap-2 w-[90px] h-[90px] z-20')}
                        >
                            <Image
                                src="/redact/assets/images/googledrive.svg"
                                alt="google-drive"
                                width={30}
                                height={30}
                            />
                            <span className='text-xs'>Google Drive</span>
                        </Button>
                        <Button
                            size={"sm"}
                            variant={"secondary"}
                            className={cn('flex-col gap-2 w-[90px] h-[90px] z-20')}
                        >
                            <Image
                                src="/redact/assets/images/dropbox.svg"
                                alt="dropbox"
                                width={30}
                                height={30}
                            />
                            <span className='text-xs'>Dropbox</span>
                        </Button>
                        <Button
                            size={"sm"}
                            variant={"secondary"}
                            className={cn('flex-col gap-2 w-[90px] h-[90px] z-20')}
                        >
                            <Image
                                src="/redact/assets/images/onedrive.svg"
                                alt="onedrive"
                                width={30}
                                height={30}
                            />
                            <span className='text-xs'>OneDrive</span>
                        </Button>
                    </div>

                    {
                        error && (
                            <div className='text-red-500 font-[500] flex items-center justify-center gap-2 my-2'>
                                <IoMdInformationCircle size={20} />
                                <p>You can only upload a maximum of 5 files at a time</p>
                            </div>
                        )
                    }
                </label>
            </div>
        </DialogContent>
    )
}

export default function AddFilesDialog(props: FilesDialogProps) {
    if ('trigger' in props) {
        return (
            <Dialog>
                <DialogTrigger asChild>
                    {props.trigger}
                </DialogTrigger>
                <DialogContent_ />
            </Dialog>
        )
    } else {
        return (
            <Dialog open={props.open} onOpenChange={props.onOpenChange}>
                <DialogContent_ />
            </Dialog>
        )
    }
}
