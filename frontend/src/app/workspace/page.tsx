"use client";

import { useFiles } from '@/components/context/FilesContext';
import { RedactedWord, useRedact } from '@/components/context/RedactContext';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Switch } from '@/components/ui/switch';
import ExportDialog from '@/components/workspace/export-dialog';
import SearchSheet from '@/components/workspace/search-sheet';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BiSolidChevronLeftCircle, BiSolidChevronRightCircle } from "react-icons/bi";
import { FaFloppyDisk } from "react-icons/fa6";
import { LuTextSelect } from "react-icons/lu";
import { MdCheckBoxOutlineBlank } from "react-icons/md";
import { TbClick, TbFileSearch } from "react-icons/tb";
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const Document = dynamic(() => import('react-pdf').then(module => module.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then(module => module.Page), { ssr: false });

function RedactedOverlay({ word, redactionPreview, onRemoveOverlay }: Readonly<{ word: RedactedWord, redactionPreview: boolean, onRemoveOverlay: () => void; }>) {
    return (
        <>
            {
                word.show && (
                    <HoverCard>
                        <HoverCardTrigger asChild>
                            <div
                                className={cn('redact-overlay absolute z-20 cursor-pointer', {
                                    'preview': redactionPreview,
                                    'redacted': !redactionPreview,
                                })}
                                style={{
                                    top: word.bbox.y + "px",
                                    left: word.bbox.x + "px",
                                    width: word.bbox.width + "px",
                                    height: word.bbox.height + "px",
                                }}
                            >
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className={cn('w-fit p-2')}>
                            <Button size={'icon'} variant={'ghost'} onClick={onRemoveOverlay}>
                                <Trash2 size={20} />
                            </Button>
                        </HoverCardContent>
                    </HoverCard>
                )
            }
        </>
    );
}

export default function Workspace() {
    const [numPages, setNumPages] = useState(0);
    const [isRedacting, setIsRedacting] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const [redactionPreview, setRedactionPreview] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { files, currentFileIndex } = useFiles();
    const currentFile = files[currentFileIndex];
    const { aiRedact, downloadRedactedDocument, setFile, file, redactedDoc, words, setWords, categories, isAIRedacting } = useRedact();
    const [searchSheetOpen, setSearchSheetOpen] = useState(false);
    const [isCovering, setIsCovering] = useState(false);
    const [isMouseDown, setIsMouseDown] = useState(false);
    const [areaSelection, setAreaSelection] = useState({
        x: 0,
        y: 0,
        width: 0,
        height: 0
    });
    const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

    useEffect(() => {
        if (!intersectionObserverRef.current) {
            console.log("Creating Intersection Observer");
            intersectionObserverRef.current = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    console.log(entry)
                    if (entry.isIntersecting) {
                        setCurrentPage(parseInt(entry.target.getAttribute('data-page-number')!));
                    }
                });
            }, {
                threshold: 0.3
            });
        }

        return () => {
            if (intersectionObserverRef.current) {
                intersectionObserverRef.current.disconnect();
            }
        }
    }, [numPages]);

    useEffect(() => {
        if (areaSelection.x === 0 && areaSelection.y === 0 && areaSelection.width === 0 && areaSelection.height === 0) {
            return;
        }

        if (isMouseDown) {
            return;
        }

        const rect = document.getElementById(`selection-${currentPage}`)!.getBoundingClientRect();
        const canvas = document.querySelector(`.page-preview[data-page-number="${currentPage}"] canvas`) as HTMLCanvasElement;
        if (canvas) {
            const canvasRect = canvas.getBoundingClientRect();
            const pageSize = redactedDoc!.getPages()[currentPage - 1].getSize();

            // Scale factors to adjust for canvas and PDF page sizes
            const scaleX = pageSize.width / canvasRect.width;
            const scaleY = pageSize.height / canvasRect.height;

            // Convert coordinates relative to the canvas and apply scaling
            const x = (rect.left - canvasRect.left) * scaleX;
            const y = (canvasRect.height - (rect.bottom - canvasRect.top)) * scaleY; // Flip and scale y coordinate
            const width = rect.width * scaleX;
            const height = rect.height * scaleY;

            setWords(prev => [...prev, {
                page: currentPage - 1,
                text: "",
                bbox: {
                    x: areaSelection.x,
                    y: areaSelection.y,
                    width: areaSelection.width,
                    height: areaSelection.height,
                },
                pdfBbox: {
                    x,
                    y: pageSize.height - y - height,
                    width,
                    height
                },
                show: true
            }]);
            // Reset selection
            setAreaSelection({
                x: 0,
                y: 0,
                width: 0,
                height: 0
            });
        }
    }, [areaSelection, isMouseDown]);


    useEffect(() => {
        (async () => {
            if (currentFile) {
                await setFile(currentFile as Blob);
            }
        })()
    }, [currentFile]);

    useEffect(() => {
        (async () => {
            await aiRedact();
        })()
    }, [file]);

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

    useEffect(() => {
        document.querySelector(`.page-preview[data-page-number="${currentPage}"]`)?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }, [currentPage]);

    const nextPage = () => {
        if (currentPage == numPages) {
            return;
        }

        setCurrentPage(currentPage + 1);
    }

    const previousPage = () => {
        if (currentPage == 1) {
            return;
        }

        setCurrentPage(currentPage - 1);
    }

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
                        const pageSize = redactedDoc!.getPages()[page - 1].getSize();

                        // Scale factors to adjust for canvas and PDF page sizes
                        const scaleX = pageSize.width / canvasRect.width;
                        const scaleY = pageSize.height / canvasRect.height;
                        const pagePreviewRect = canvas.parentElement!.getBoundingClientRect();

                        // Convert coordinates relative to the canvas and apply scaling
                        const x = (rect.left - canvasRect.left) * scaleX;
                        const y = (canvasRect.height - (rect.bottom - canvasRect.top)) * scaleY; // Flip and scale y coordinate
                        const width = rect.width * scaleX;
                        const height = rect.height * scaleY;

                        setWords(prev => [...prev, {
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
                                y: pageSize.height - y - height,
                                width,
                                height
                            },
                            show: true
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

    return (
        <main className='h-screen max-h-screen flex flex-col'>
            <SearchSheet open={searchSheetOpen} onOpenChange={setSearchSheetOpen} />
            <nav className='flex items-center justify-between p-4 shadow-md z-30'>
                <Link href='/dashboard'>
                    <Image
                        src="/redact/assets/images/logo-full.svg"
                        alt="Logo"
                        width={200}
                        height={50}
                    />
                </Link>
                <div className='flex gap-4 items-center justify-center'>
                    <Button variant={"secondary"} className={cn('h-fit flex-col')}>
                        <TbClick size={30} />
                        <span>Move</span>
                    </Button>
                    <Button
                        variant={searchSheetOpen ? "default" : "secondary"}
                        className={cn('h-fit flex-col')}
                        onClick={() => setSearchSheetOpen(!searchSheetOpen)}
                    >
                        <TbFileSearch size={25} />
                        <span>Search</span>
                    </Button>
                    <Button
                        variant={isRedacting ? "default" : "secondary"}
                        className={cn('h-fit flex-col')}
                        onClick={handleManualRedact}
                    >
                        <LuTextSelect size={25} />
                        <span>Select</span>
                    </Button>
                    <Button
                        variant={isCovering ? "default" : "secondary"}
                        className={cn('h-fit flex-col')}
                        onClick={() => {
                            setIsCovering(prev => !prev);
                        }}
                    >
                        <MdCheckBoxOutlineBlank size={25} />
                        <span>Cover</span>
                    </Button>
                    <div className='flex gap-2 items-center justify-center'>
                        <Switch
                            checked={redactionPreview}
                            onCheckedChange={setRedactionPreview}
                        />
                        <span className='text-sm font-[500]'>Redaction Preview</span>
                    </div>
                </div>
                <div>
                    <ExportDialog
                        trigger={
                            <Button className={cn('bg-green-500 hover:bg-green-600 text-base gap-2 focus-visible:ring-green-600')}>
                                <FaFloppyDisk size={20} />
                                Finalize Redaction
                            </Button>
                        }
                        onDownloadButtonClick={downloadRedactedDocument}
                    />
                </div>
            </nav>
            <div className='grid grid-cols-[auto_1fr_auto] flex-1 overflow-y-hidden'>
                <section className='w-[260px] bg-[#dce4f5] overflow-y-auto border-r border-r-[#ccc]'>
                    <div className='p-4 shadow-md w-full text-center sticky top-0 bg-white z-10'>
                        <p className='font-[500] text-xl'>Pages</p>
                    </div>
                    <div className='w-full'>
                        <Document
                            file={currentFile}
                            className={cn('flex flex-col gap-10 my-8')}
                        >
                            {
                                Array.from({ length: numPages }, (_, index) => (
                                    <div
                                        key={index}
                                        className='flex flex-col rounded-lg border border-[#ccc] overflow-hidden mx-auto cursor-pointer'
                                        onClick={() => setCurrentPage(index + 1)}
                                    >
                                        <Page
                                            pageNumber={index + 1}
                                            className='relative select-none cursor-pointer'
                                            scale={0.2}
                                            width={Math.min(600, window.innerWidth * 0.9)}
                                            height={Math.min(600, window.innerWidth * 0.9)}
                                            customTextRenderer={(textItem) => `<span style="cursor: pointer;">${textItem.str}</span>`}
                                        />
                                        <div className={cn('w-full text-white p-1.5 text-center text-sm', {
                                            'bg-primary': currentPage === index + 1,
                                            'bg-primary/50': currentPage !== index + 1
                                        })}>
                                            {index + 1} of {numPages}
                                        </div>
                                    </div>
                                ))
                            }
                        </Document>
                    </div>
                </section>
                <section ref={ref} className='h-full overflow-y-auto py-8 text-justify relative'>
                    <Document
                        file={currentFile}
                        onLoadSuccess={async (pdf) => {
                            setNumPages(pdf.numPages);
                        }}
                        className={cn('flex flex-col items-center justify-center gap-8 relative')}
                    >
                        {
                            Array.from({ length: numPages }, (_, index) => (
                                <Page
                                    key={index}
                                    pageNumber={index + 1}
                                    className='border border-[#ccc] shadow-md page-preview relative'
                                    scale={1.5}
                                    width={Math.min(600, window.innerWidth * 0.9)}
                                    customTextRenderer={customTextRenderer}
                                    onMouseDown={(e) => {
                                        if (!isCovering) return;

                                        setIsMouseDown(true);

                                        const element = document.querySelector(`.page-preview[data-page-number="${index + 1}"]`) as HTMLElement;

                                        if (ref.current) {
                                            ref.current.style.userSelect = 'none';
                                        }

                                        setAreaSelection({
                                            x: e.clientX - element.getBoundingClientRect().left,
                                            y: e.clientY - element.getBoundingClientRect().top,
                                            width: 0,
                                            height: 0
                                        });

                                        function handleMouseMove(e: MouseEvent) {
                                            setAreaSelection(prev => ({
                                                ...prev,
                                                width: e.clientX - prev.x - element.getBoundingClientRect().left,
                                                height: e.clientY - prev.y - element.getBoundingClientRect().top
                                            }));
                                        }

                                        element.addEventListener('mousemove', handleMouseMove);

                                        element.addEventListener('mouseup', () => {
                                            setIsMouseDown(false);
                                            if (ref.current) {
                                                ref.current.style.userSelect = 'auto';
                                            }
                                            element.removeEventListener('mousemove', handleMouseMove);
                                        })
                                    }}
                                    onRenderSuccess={() => {
                                        const cp = document.querySelector(`.page-preview[data-page-number="${index + 1}"]`) as HTMLElement;
                                        intersectionObserverRef.current!.observe(cp);
                                    }}
                                >
                                    <div
                                        id={`selection-${index + 1}`}
                                        className='absolute z-20 bg-blue-500/50 border-blue-700'
                                        style={{
                                            top: areaSelection.y + "px",
                                            left: areaSelection.x + "px",
                                            width: areaSelection.width + "px",
                                            height: areaSelection.height + "px",
                                        }}
                                    ></div>
                                    {
                                        words.filter(word => word.page === index).map((word, index) => (
                                            <RedactedOverlay
                                                key={index}
                                                word={word}
                                                redactionPreview={redactionPreview}
                                                onRemoveOverlay={() => {
                                                    setWords(prev => prev.filter((item) => item !== word));
                                                }}
                                            />
                                        ))
                                    }
                                </Page>
                            ))
                        }
                    </Document>
                    {
                        numPages > 0 && <div
                            className='bg-zinc-500 flex gap-4 w-fit rounded-full p-1 sticky -bottom-2 mx-auto z-30'
                        >
                            <button
                                onClick={previousPage}
                                className={cn({
                                    'opacity-50 cursor-not-allowed': currentPage === 1
                                })}
                            >
                                <BiSolidChevronLeftCircle size={25} color='white' />
                            </button>
                            {currentPage}/{numPages}
                            <button
                                onClick={nextPage}
                                className={cn({
                                    'opacity-50 cursor-not-allowed': currentPage === numPages
                                })}
                            >
                                <BiSolidChevronRightCircle size={25} color='white' />
                            </button>
                        </div>
                    }
                </section>
                <section className='w-[300px] bg-[#dce4f5] overflow-y-auto border-l border-l-[#ccc] flex flex-col'>
                    <div className='p-4 shadow-md w-full text-center sticky top-0 bg-white z-10'>
                        <p className='font-[500] text-xl'>Categories</p>
                    </div>
                    <div className='w-full p-4 flex flex-col gap-4'>
                        {
                            isAIRedacting && (
                                <div className='flex items-center gap-2'>
                                    <div className='w-5 h-5 bg-primary rounded-full animate-pulse'></div>
                                    <span>AI Redacting...</span>
                                </div>
                            )
                        }
                        {
                            categories.map((category, index) => (
                                <Accordion key={index} type="single" collapsible className={cn('bg-white rounded-sm')}>
                                    <AccordionItem value="item-1" className={cn('border-none')}>
                                        <AccordionTrigger
                                            className={cn('hover:no-underline p-3')}
                                        >
                                            <div className='flex items-center gap-3'>
                                                <input
                                                    type="checkbox"
                                                    checked={words.filter(word => word.category === category).every(word => !!word.show)}
                                                    className='w-5 h-5 accent-primary'
                                                    onChange={(e) => {
                                                        setWords(prev => prev.map((word) => {
                                                            if (word.category === category) {
                                                                console.log(word.show);
                                                                word.show = !word.show;
                                                            }

                                                            return word;
                                                        }));
                                                    }}
                                                />
                                                <span>{category} ({words.filter(word => word.category === category).length})</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className={cn('p-3 flex flex-col gap-3')}>
                                            {
                                                Object.entries(
                                                    words.filter(word => word.category === category)
                                                        .reduce((acc, curr) => {
                                                            if (!acc[curr.text]) {
                                                                acc[curr.text] = 1;
                                                            } else {
                                                                acc[curr.text]++;
                                                            }
                                                            return acc;
                                                        }, {} as Record<string, number>)
                                                ).map((key, index) => (
                                                    <div key={index} className='flex gap-3 items-center justify-between w-full'>
                                                        <span className={cn('text-sm font-[500]', {
                                                            "break-all": !key[0].includes(' ')
                                                        })}>{key[0]} {key[1] > 1 && `(${key[1]})`}</span>
                                                        <Checkbox
                                                            checked={words.find(word => word.text === key[0])?.show}
                                                            className={cn('rounded w-5 h-5')}
                                                            onCheckedChange={(checked) => {
                                                                setWords(prev => prev.map((word) => {
                                                                    if (word.text === key[0]) {
                                                                        word.show = !!checked;
                                                                    }

                                                                    return word;
                                                                }));
                                                            }}
                                                        />
                                                    </div>
                                                ))
                                            }
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            ))
                        }
                    </div>
                    <div className='flex-grow'></div>
                    <div className='flex gap-4 p-4'>
                        <Button
                            size={'sm'}
                            disabled={words.every(word => !!word.show)}
                            onClick={() => {
                                setWords(prev => prev.map((word) => {
                                    word.show = true;
                                    return word;
                                }));
                            }}
                        >Select All</Button>
                        <Button
                            variant={'outline'}
                            size={'sm'}
                            className='border border-primary text-primary hover:text-primary'
                            disabled={words.every(word => !word.show)}
                            onClick={() => {
                                setWords(prev => prev.map((word) => {
                                    word.show = false;
                                    return word;
                                }));
                            }}
                        >
                            Unselect All
                        </Button>
                    </div>
                </section>
            </div>
        </main>
    )
}
