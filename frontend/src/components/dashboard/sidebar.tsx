import { cn } from '@/lib/utils';
import { CgLoadbarDoc } from "react-icons/cg";
import { GoHomeFill } from "react-icons/go";
import { GrDocumentTransfer } from "react-icons/gr";
import { IoRocketOutline, IoSettingsOutline } from "react-icons/io5";
import { Button } from '../ui/button';

export default function Sidebar() {
    return (
        <aside className='bg-white sticky top-0 h-screen max-h-screen overflow-y-auto flex flex-col max-w-[230px] w-fit md:w-full'>
            <div className='w-full h-[70px] bg-red-500'></div>
            <div className='flex flex-col gap-2 mx-2 mt-2 mb-2'>
                <Button
                    className={cn('justify-start gap-4 md:py-6')}
                >
                    <GoHomeFill size={20} />
                    <span className='hidden md:inline'>Dashboard</span>
                </Button>
                <Button
                    className={cn('justify-start gap-4 md:py-6')}
                >
                    <CgLoadbarDoc size={20} />
                    <span className='hidden md:inline'>Document</span>
                </Button>
                <Button
                    className={cn('justify-start gap-4 md:py-6')}
                >
                    <GrDocumentTransfer size={16} />
                    <span className='hidden md:inline'>Conversion Tool</span>
                </Button>
            </div>
            <div className='flex-grow'></div>
            <div className='flex flex-col gap-2 mx-2 my-2 mb-8'>
                <Button
                    className={cn('justify-start gap-4 md:py-6')}
                >
                    <IoRocketOutline size={20} />
                    <span className='hidden md:inline'>Begin Tour</span>
                </Button>
                <Button
                    className={cn('justify-start gap-4 md:py-6')}
                >
                    <IoSettingsOutline size={20} />
                    <span className='hidden md:inline'>Settings</span>
                </Button>
            </div>
        </aside>
    )
}
