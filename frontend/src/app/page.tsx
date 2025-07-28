/* "use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"
import { setImage } from "@/redux/features/image/imageSlice";
import { setPdf } from "@/redux/features/pdf/pdfSlice";
import { useAppDispatch } from "@/redux/hooks/hooks";
import { redirect, useRouter } from "next/navigation";
import { useState } from "react"; */

import { redirect } from "next/navigation";

export default function Home() {
  /* const [loading, setLoading] = useState(false);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [file, setFile] = useState<File>(); */

  redirect("/dashboard");

  /* return (
        <main className="flex items-center justify-center h-screen">
            <form
                className="flex flex-col gap-4 max-w-screen-sm w-full items-center"
                onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                        switch (file?.type) {
                            case "application/pdf":
                                dispatch(setPdf({
                                    pdf: file
                                }));
                               /*  router.push('/workspace');
                                router.push('/pdf');
                                break;
                            
                            case "image/jpeg":
                            case "image/png":
                                dispatch(setImage({
                                    image: file
                                }));
                                router.push('/image');
                                break;

                            default:
                                alert("Invalid file type");
                                break;
                        }

                    } catch (error) {
                        console.error(error);
                    } finally {
                        setLoading(false);
                    }
                }}>
                <h1 className="text-2xl font-semibold">Upload</h1>
                <Input type="file" accept="application/pdf, image/jpeg, image/png" name="pdf" onChange={(e) => {
                    if (!e.target.files) return;

                    setFile(e.target.files[0]);
                }} />
                <Button disabled={loading} type="submit" className="w-fit gap-2">
                    {
                        loading && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="white" d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" opacity="0.25" />
                            <path fill="white" d="M12,4a8,8,0,0,1,7.89,6.7A1.53,1.53,0,0,0,21.38,12h0a1.5,1.5,0,0,0,1.48-1.75,11,11,0,0,0-21.72,0A1.5,1.5,0,0,0,2.62,12h0a1.53,1.53,0,0,0,1.49-1.3A8,8,0,0,1,12,4Z">
                                <animateTransform attributeName="transform" dur="0.75s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12" />
                            </path>
                        </svg>
                    }
                    <span>Upload</span>
                </Button>
            </form>
        </main>
    ) */
}
