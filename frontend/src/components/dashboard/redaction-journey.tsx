"use client";

import React, { useState } from "react";
import SelectRedactionCard from "./select-redaction-card";
import { useFiles } from "../context/FilesContext";
import AddFilesDialog from "../add-files-dialog";
import { useRedact } from "../context/RedactContext";

export default function RedactionJourney() {
  const files = useFiles();
  const [open, setOpen] = useState(false);
  const redact = useRedact();

  return (
    <div className="bg-white flex-grow rounded-tl-lg p-4 md:p-6">
      <AddFilesDialog open={open} onOpenChange={setOpen} />
      <p className="text-2xl font-semibold text-[#3B3B4F]">
        Begin Your Redaction Journey Effortlessly
      </p>
      <div className="flex flex-wrap gap-6 mt-8">
        <SelectRedactionCard
          title="Redact File"
          image={"/redact/assets/images/redact-doc.svg"}
          description="Protect sensitive information in your documents by quickly redacting text and data"
          onClick={() => {
            files.setFileType("application/pdf");
            redact.setRedactionType("Manual");
            setOpen(true);
          }}
        />
        <SelectRedactionCard
          title="Redact Image"
          image={"/redact/assets/images/redact-img.svg"}
          description="Quickly blur identities and sensitive information in your images to protect privacy"
          onClick={() => {
            files.setFileType("image/*");
            redact.setRedactionType("Manual");
            setOpen(true);
          }}
        />
        <SelectRedactionCard
          title="Redact Video"
          image={"/redact/assets/images/redact-video.svg"}
          description="Efficiently hide confidential content by redact specific scenes or details in your videos"
          onClick={() => {
            files.setFileType("video/*");
            redact.setRedactionType("Manual");
            setOpen(true);
          }}
        />
      </div>
    </div>
  );
}
