"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Tenants", url: "/tenants", icon: Users },
    { title: "Bills", url: "/bills", icon: FileText },
];

export function AppSidebar() {
    const pathname = usePathname();

    const isActive = (url) => {
        if (url === "/") return pathname === "/";
        return pathname.startsWith(url);
    };

    return (
        <Sidebar className="border-r border-sidebar-border bg-sidebar">
            <SidebarContent>
                <div className="p-6 pb-2">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                            RENTAL
                        </span>
                    </div>

                    <div className="mb-8 p-4 rounded-3xl glass-card">
                        <p className="text-xs text-muted-foreground font-medium">Welcome back,</p>
                        <p className="text-sm font-bold truncate">Dilan Kumar</p>
                    </div>
                </div>

                <SidebarGroup>
                    <SidebarGroupLabel className="px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                        Main Menu
                    </SidebarGroupLabel>
                    <SidebarGroupContent className="px-3">
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title} className="mb-1">
                                    <SidebarMenuButton
                                        render={<Link href={item.url} />}
                                        isActive={isActive(item.url)}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-6 rounded-2xl transition-all duration-300",
                                            isActive(item.url)
                                                ? "sidebar-active"
                                                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                        )}
                                    >
                                        <item.icon className={cn("w-5 h-5", isActive(item.url) ? "text-white" : "text-muted-foreground")} />
                                        <span className="font-semibold">{item.title}</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
