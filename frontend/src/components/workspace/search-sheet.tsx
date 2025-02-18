"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRedact } from "../context/RedactContext";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";

type SearchResult = {
    text: string;
    page: number;
    span: HTMLSpanElement;
    itemIndex: number;
    bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    selected?: boolean;
};

type SearchSheetProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function SearchSheet({ open, onOpenChange }: Readonly<SearchSheetProps>) {
    const ref = useRef<HTMLDivElement>(null);
    const [searchText, setSearchText] = useState<string>("");
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const { setWords, redactedDoc } = useRedact();

    useEffect(() => {
        for (const res of searchResults) {
            if (!res.selected) continue;

            const div = document.createElement('div');
            div.classList.add('search-result');
            div.style.position = 'absolute';
            div.style.left = `${res.bbox.x}px`;
            div.style.top = `${res.bbox.y}px`;
            div.style.width = `${res.bbox.width}px`;
            div.style.height = `${res.bbox.height}px`;
            div.style.backgroundColor = '#fbbf24';
            div.style.opacity = '0.5';
            div.style.zIndex = '1000';
            div.style.display = 'inline';

            document.querySelector(`.page-preview[data-page-number="${res.page + 1}"]`)?.appendChild(div);
        }

        return () => {
            for (const res of searchResults) {
                const pagePreview = document.querySelector(`.page-preview[data-page-number="${res.page + 1}"]`);
                const divsToRemove = pagePreview?.querySelectorAll('div.search-result');
                if (pagePreview && divsToRemove?.length !== 0) {
                    const divs = Array.from(divsToRemove!);
                    for (const div of divs) {
                        pagePreview.removeChild(div);
                    }
                }
            }
        }
    }, [searchResults]);

    function search(text: string) {
        if (!text) {
            setSearchResults([]);
            return;
        }

        const spans = document.querySelectorAll('.page-preview .react-pdf__Page__textContent span') as NodeListOf<HTMLSpanElement>;
        const searchLower = text.toLowerCase();

        spans.forEach(span => {
            const textContent = span.textContent;
            const page = span.dataset.page ? parseInt(span.dataset.page) - 1 : 0;
            const itemIndex = span.dataset.itemindex ? parseInt(span.dataset.itemindex) : 0;

            if (!textContent || !span.dataset.page || !span.dataset.itemindex) return;

            const textContentLower = textContent.toLowerCase();

            if (textContentLower.includes(searchLower)) {
                const parts = textContent.split(new RegExp(`(${text})`, 'i')); // Case-insensitive split
                const fpl = parts[0].length; // Length before the match
                const spl = text.length; // Matched string length
                const rects = span.getBoundingClientRect();
                const wpc = rects.width / textContent.length; // Width per character
                const sw = wpc * spl; // Width of the search term
                const sx = rects.x + fpl * wpc; // Start X position of the search term
                const sy = rects.y; // Y position of the search term

                const canvas = document.querySelector(`.page-preview[data-page-number="${page + 1}"] canvas`) as HTMLCanvasElement;
                if (!canvas) return;

                const canvasRects = canvas.getBoundingClientRect();

                setSearchResults(prev => [...prev, {
                    ...prev.find(r => r.span === span),
                    text: RegExp(new RegExp(text, 'i')).exec(textContent)![0],
                    page: page,
                    itemIndex: itemIndex,
                    span: span,
                    bbox: {
                        x: sx - canvasRects.x,
                        y: sy - canvasRects.y,
                        width: sw,
                        height: rects.height
                    },
                    selected: true
                }]);
            } else {
                // Clear results for unmatched spans
                setSearchResults(prev => {
                    console.log(prev.filter(r => r.text.toLowerCase() === searchLower));
                    return prev.filter(r => r.text.toLowerCase() === searchLower);
                });
            }
        });
    }

    function applyRedactions() {
        setWords(prev => [
            ...prev,
            ...searchResults.map(r => {
                const canvas = document.querySelector(`.page-preview[data-page-number="${r.page + 1}"] canvas`) as HTMLCanvasElement;

                if (!canvas) {
                    return {
                        text: r.text,
                        page: r.page,
                        show: true,
                        bbox: r.bbox,
                        pdfBbox: {
                            x: 0,
                            y: 0,
                            height: 0,
                            width: 0
                        },
                    };
                }

                // Get canvas dimensions and page dimensions from the redacted PDF
                const canvasRect = canvas.getBoundingClientRect();
                const page = redactedDoc!.getPages()[r.page];
                const pageSize = page.getSize();

                // Calculate the scale factors for converting canvas to PDF coordinates
                const scaleX = pageSize.width / canvasRect.width;
                const scaleY = pageSize.height / canvasRect.height;

                // Calculate the PDF coordinates by scaling and flipping the Y-axis
                const pdfX = r.bbox.x * scaleX;
                const pdfY = r.bbox.y * scaleY;
                const pdfWidth = r.bbox.width * scaleX;
                const pdfHeight = r.bbox.height * scaleY;

                // Return the redacted bounding box data
                return {
                    text: r.text,
                    page: r.page,
                    show: true,
                    bbox: r.bbox,  // Original bounding box (canvas coordinates)
                    pdfBbox: {     // Transformed bounding box (PDF coordinates)
                        x: pdfX,
                        y: pdfY,
                        height: pdfHeight,
                        width: pdfWidth
                    },
                };
            })
        ]);

        // Clear the search results and reset the search text
        setSearchResults([]);
        setSearchText("");
    }

    return (
        <aside
            ref={ref}
            className={cn("fixed bg-white right-0 top-0 flex flex-col h-full w-96 shadow-lg z-50 transform transition-transform duration-300 ease-in-out p-6 overflow-hidden", {
                'translate-x-full': !open,
                'translate-x-0': open
            })}
        >
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Search and Redact</h3>
                <Button
                    variant={'ghost'}
                    size={'icon'}
                    onClick={() => {
                        onOpenChange(false);
                        setSearchResults([]);
                        setSearchText("");
                    }}
                >
                    <X size={20} />
                </Button>
            </div>
            <div className="flex items-center justify-center mt-4 relative">
                <Input
                    type="text"
                    placeholder="Search for text"
                    className="pr-10"
                    value={searchText}
                    onChange={(e) => {
                        setSearchText(e.target.value);
                        search(e.target.value);
                    }}
                />
                <Search size={20} className="absolute right-3" />
            </div>
            <Button
                size={"sm"}
                className="mt-4 w-fit"
                disabled={searchResults.length === 0}
                onClick={applyRedactions}
            >
                Apply {searchResults.filter(r => !!r.selected).length === searchResults.length ? "All" : "Selected"} Redactions
            </Button>
            <div className="flex flex-col gap-4 flex-1 mt-4 overflow-y-auto">
                {
                    searchResults.map((result, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-start gap-2 p-4 shadow-sm border border-[#ccc] rounded-lg"
                        >
                            <Checkbox
                                className="w-5 h-5 rounded"
                                checked={result.selected}
                                onCheckedChange={() => {
                                    setSearchResults(prev => prev.map(r => {
                                        if (r.itemIndex === result.itemIndex && r.page === result.page) {
                                            return {
                                                ...r,
                                                selected: !r.selected
                                            }
                                        }
                                        return r;
                                    }))
                                }}
                            />
                            <p className="font-normal text-base">{result.text}</p>
                        </div>
                    ))
                }
            </div>
        </aside>
    )
}