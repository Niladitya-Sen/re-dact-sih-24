import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import React, { useState } from 'react';
import { Switch } from "../ui/switch";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export default function ExportDialog({ trigger, onDownloadButtonClick }: Readonly<{ trigger: React.ReactNode, onDownloadButtonClick: (password?: string) => void; }>) {
    const [password, setPassword] = useState<string>('');
    const [isEncrypted, setIsEncrypted] = useState<boolean>(false);

    return (
        <Dialog>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Export Document</DialogTitle>
                    <DialogDescription>
                        <div className="flex items-center justify-start gap-2 mt-4">
                            <Switch
                                checked={isEncrypted}
                                onCheckedChange={(checked) => setIsEncrypted(checked)}
                            />
                            <span>Encrypt Document</span>
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <div className={cn("mt-1 flex flex-col gap-1", {
                    "pointer-events-none opacity-60 cursor-not-allowed": !isEncrypted
                })}>
                    <span className="font-[500]">Enter Password</span>
                    <Input
                        type="password"
                        placeholder="Enter a secure password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <Button onClick={() => {
                    onDownloadButtonClick(password)
                }}>Download</Button>
            </DialogContent>
        </Dialog>

    )
}
