"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, FileText, Zap } from "lucide-react";

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
        <Sidebar>
            <SidebarContent className="bg-[#0a0f1a]">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-bold mt-4 mb-6 tracking-[0.2em] flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <Zap className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-cyan-400">RENT MANAGER</span>
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton render={<Link href={item.url} />} isActive={isActive(item.url)}>
                                        <item.icon className="w-4 h-4 mr-3" />
                                        <span className="font-medium text-sm">{item.title}</span>
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
