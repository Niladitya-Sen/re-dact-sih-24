"use client";

import React, { createContext, useContext, useMemo, useState } from 'react';

type LoadingContextType = {
    show: (altText?: string) => void;
    hide: () => void;
};

const LoadingContext = createContext<LoadingContextType | null>(null);

export const useLoader = () => {
    const context = useContext(LoadingContext);

    if (!context) {
        throw new Error('useLoader must be used within a LoadingContextProvider');
    }

    return context;
}

export default function LoadingContextProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [loading, setLoading] = useState<boolean>(false);
    const [altText, setAltText] = useState<string>();

    function show(altText?: string) {
        setAltText(altText);
        setLoading(true);
    }

    function hide() {
        setLoading(false);
        setAltText(undefined);
    }

    const values = useMemo(() => ({
        show,
        hide,
    }), [loading, altText]);

    return (
        <LoadingContext.Provider value={values}>
            {
                loading && (
                    <div className="fixed top-0 left-0 z-[9999] w-full h-full bg-black bg-opacity-60 backdrop-blur-md flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24">
                                <path fill="white" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.25" />
                                <path fill="white" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
                                    <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
                                </path>
                            </svg>
                            <p className="text-white mt-4 font-[500]">{altText}</p>
                        </div>
                    </div>
                )
            }
            {children}
        </LoadingContext.Provider>
    )
}
