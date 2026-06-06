"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

export default function PrintButton() {
    useEffect(() => {
        const timer = setTimeout(() => {
            window.print();
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    return (
        <button
            onClick={() => window.print()}
            className="group flex items-center gap-3 bg-slate-800 text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-slate-700 transition-all outline-none border-0"
        >
            <Printer className="w-5 h-5 transition-transform" />
            Print Statement
        </button>
    );
}
