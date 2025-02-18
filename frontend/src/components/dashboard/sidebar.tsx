"use client";

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { CgLoadbarDoc } from "react-icons/cg";
import { GoHomeFill } from "react-icons/go";
import { GrDocumentTransfer } from "react-icons/gr";
import { IoRocketOutline, IoSettingsOutline } from "react-icons/io5";
import { buttonVariants } from '../ui/button';

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className='bg-white h-screen max-h-screen flex flex-col max-w-[230px] w-fit md:w-full'>
            <Image
                src="/assets/images/logo-full.svg"
                alt="Logo"
                width={200}
                height={50}
            />
            <div className='flex flex-col gap-2 mx-2 mt-2 mb-2'>
                <button
                    className={cn({
                        'sidebar-link-active flex items-center text-sm': pathname === '/dashboard',
                        [buttonVariants({ variant: 'secondary' })]: pathname !== '/dashboard'
                    }, 'rounded-lg justify-center h-10 w-10 md:w-full md:justify-start gap-4 p-0 md:px-4 md:py-6')}
                >
                    <GoHomeFill size={20} />
                    <span className='hidden md:inline'>Dashboard</span>
                </button>
                <button
                    className={cn({
                        'sidebar-link-active flex items-center text-sm': pathname === '/document',
                        [buttonVariants({ variant: 'secondary' })]: pathname !== '/document'
                    }, 'rounded-lg justify-center h-10 w-10 md:w-full md:justify-start gap-4 p-0 md:px-4 md:py-6')}
                >
                    <CgLoadbarDoc size={20} />
                    <span className='hidden md:inline'>Document</span>
                </button>
                <button
                    className={cn({
                        'sidebar-link-active flex items-center text-sm': pathname === '/convert',
                        [buttonVariants({ variant: 'secondary' })]: pathname !== '/convert'
                    }, 'rounded-lg justify-center h-10 w-10 md:w-full md:justify-start gap-4 p-0 md:px-4 md:py-6')}
                >
                    <GrDocumentTransfer size={16} />
                    <span className='hidden md:inline'>Conversion Tool</span>
                </button>
            </div>
            <div className='flex-grow'></div>
            <div className='flex flex-col gap-2 mx-2 my-2 mb-8'>
                <button
                    className={cn({
                        'sidebar-link-active flex items-center text-sm': pathname === '/tour',
                        [buttonVariants({ variant: 'secondary' })]: pathname !== '/tour'
                    }, 'rounded-lg justify-center h-10 w-10 md:w-full md:justify-start gap-4 p-0 md:px-4 md:py-6')}
                >
                    <IoRocketOutline size={20} />
                    <span className='hidden md:inline'>Begin Tour</span>
                </button>
                <button
                    className={cn({
                        'sidebar-link-active flex items-center text-sm': pathname === '/settings',
                        [buttonVariants({ variant: 'secondary' })]: pathname !== '/settings'
                    }, 'rounded-lg justify-center h-10 w-10 md:w-full md:justify-start gap-4 p-0 md:px-4 md:py-6')}
                >
                    <IoSettingsOutline size={20} />
                    <span className='hidden md:inline'>Settings</span>
                </button>
            </div>
        </aside>
    )
}
