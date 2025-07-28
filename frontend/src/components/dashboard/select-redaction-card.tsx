"use client";

import Image from "next/image";
import { Button } from "../ui/button";

export default function SelectRedactionCard({
  title,
  description,
  image,
  onClick,
}: Readonly<{
  title: string;
  description: string;
  image: string;
  onClick: () => void;
}>) {
  return (
    <div className="max-w-[350px] w-full flex flex-col rounded-lg overflow-hidden shadow-md">
      <Image src={image} alt={title} width={350} height={200} />
      <div className="flex gap-8 items-center justify-between bg-[#F8EFFF] p-4">
        <div>
          <p className="text-base font-[500]">{title}</p>
          <p className="text-xs font-normal">{description}</p>
        </div>
        <Button size={"sm"} onClick={onClick}>
          Upload
        </Button>
      </div>
    </div>
  );
}
