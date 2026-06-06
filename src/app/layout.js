import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const pjs = Plus_Jakarta_Sans({
  variable: "--font-pjs",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Rent Manager",
  description: "Manage your tenants and bills",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${pjs.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300">
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1 overflow-auto w-full">
            <div className="flex items-center p-4 lg:hidden border-b border-white/[0.06] pb-4 mb-4">
              <SidebarTrigger className="text-slate-400 hover:text-white" />
            </div>
            <div className="p-4 md:p-8">
              {children}
            </div>
          </main>
        </SidebarProvider>
      </body>
    </html>
  );
}
