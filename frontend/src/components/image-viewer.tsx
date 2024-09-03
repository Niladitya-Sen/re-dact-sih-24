"use client";

import { useAppSelector } from '@/redux/hooks/hooks';
import Image from 'next/image';

export default function ImageViewer() {

    const image = useAppSelector(state => state.image.image);

    return (
        <div>
            {
                image ? <Image src={URL.createObjectURL(image)} alt="image" width={500} height={500} /> : <h1>No image</h1>
            }
        </div>
    )
}
