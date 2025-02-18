import { cn } from "@/lib/utils";
import StoreProvider from "@/redux/store/StoreProvider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import FilesContextProvider from "@/components/context/FilesContext";
import RedactContextProvider from "@/components/context/RedactContext";
import LoadingContextProvider from "@/components/context/LoadingContext";
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RE-DACT",
  description: "RE-DACT is an advanced redaction tool offering customizable redaction, masking, and anonymization across multiple formats like text, images, and PDFs. It ensures data security with no third-party access, while also generating realistic synthetic data using machine learning. Designed with an intuitive GUI, RE-DACT is accessible both online and offline, providing a secure and user-friendly solution for data privacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, "antialiased")}>
        <NextTopLoader
          color="#874bee"
          showSpinner={false}
          height={40}
        />
        <LoadingContextProvider>
          <StoreProvider>
            <FilesContextProvider>
              <RedactContextProvider>
                {children}
              </RedactContextProvider>
            </FilesContextProvider>
          </StoreProvider>
        </LoadingContextProvider>
      </body>
    </html>
  );
}
