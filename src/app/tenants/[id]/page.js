"use client";

import { useEffect, useState, use } from "react";
import { ArrowLeft, Calendar, Home, DollarSign, Activity, Clock, Edit2, Wallet, Zap, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";

const NEPALI_MONTHS = [
    "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

export default function TenantProfilePage({ params }) {
    const resolvedParams = use(params);
    const tenantId = resolvedParams.id;

    const [tenant, setTenant] = useState(null);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonthFilter, setSelectedMonthFilter] = useState("ALL");

    useEffect(() => {
        async function fetchData() {
            try {
                const [tenantRes, billsRes] = await Promise.all([
                    fetch(`/api/tenants/${tenantId}`).then(r => r.json()),
                    fetch(`/api/bills?tenantId=${tenantId}`).then(r => r.json()),
                ]);
                if (tenantRes.success) setTenant(tenantRes.data);
                if (billsRes.success) setBills(billsRes.data);
            } catch (error) {
                console.error("Failed to fetch tenant data:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [tenantId]);

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
                </div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="text-center py-24 rounded-2xl bg-[#0f172a] border border-white/[0.06]">
                <h2 className="text-2xl font-bold text-white mb-2">Tenant Not Found</h2>
                <p className="text-slate-400 mb-6">The tenant doesn&apos;t exist or has been removed.</p>
                <Link href="/tenants">
                    <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5 rounded-xl">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tenants
                    </Button>
                </Link>
            </div>
        );
    }

    const availableMonths = [...new Set(bills.map(b => b.month))].sort((a, b) => {
        const [mA, yA] = a.split(" ");
        const [mB, yB] = b.split(" ");
        if (yA !== yB) return Number(yB) - Number(yA);
        return NEPALI_MONTHS.indexOf(mB) - NEPALI_MONTHS.indexOf(mA);
    });

    const filteredBills = selectedMonthFilter === "ALL" ? bills : bills.filter(b => b.month === selectedMonthFilter);
    const selectedMonthLabel = selectedMonthFilter === "ALL" ? "All Months" : selectedMonthFilter;

    const groupedBills = {};
    filteredBills.forEach(b => {
        const key = b.month || "Unknown";
        if (!groupedBills[key]) groupedBills[key] = [];
        groupedBills[key].push(b);
    });

    const sortedMonths = Object.keys(groupedBills).sort((a, b) => {
        const [mA, yA] = a.split(" ");
        const [mB, yB] = b.split(" ");
        if (yA !== yB) return Number(yB) - Number(yA);
        return NEPALI_MONTHS.indexOf(mB) - NEPALI_MONTHS.indexOf(mA);
    });

    const totalBills = bills.length;
    const totalPaid = bills.reduce((a, b) => a + (b.paidAmount || 0), 0);
    const totalExpected = bills.reduce((a, b) => a + (b.total || 0), 0);
    const totalDue = totalExpected - totalPaid;
    const createdDate = new Date(tenant.createdAt).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric"
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Back */}
            <Link href="/tenants">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white -ml-2 hover:bg-white/5">
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
            </Link>

            {/* Profile Header */}
            <div className="relative rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600 via-blue-600 to-violet-600" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCAxMHY2aC02VjE0aDZ6bTAgMTB2Nmg2VjI0aC02em0tMTAgMHY2aC02VjI0aDZ6bTAgMTB2Nmg2VjM0aC02em0wLTIwdjZoLTZWMTRoNnptLTEwIDB2NmgtNlYxNGg2em0wIDEwdjZoNlYyNGgtNnptMCAxMHY2aDZWMzRoLTZ6bS0xMCAwdjZoLTZWMzRoNnptMC0yMHY2aC02VjE0aDZ6bTAtMTB2Nmg2VjRoLTZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="relative p-7 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-5">
                        <Avatar className="w-18 h-18 border-4 border-white/20 shadow-2xl" style={{ width: 72, height: 72 }}>
                            <AvatarFallback className="bg-white/15 text-white text-2xl font-bold backdrop-blur-sm" style={{ width: 72, height: 72, fontSize: '1.5rem' }}>
                                {tenant.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white tracking-tight">{tenant.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <Badge className="bg-white/15 text-white border-0 backdrop-blur-sm px-3 py-1 text-xs font-medium">
                                    <Home className="w-3 h-3 mr-1.5" /> Room {tenant.room}
                                </Badge>
                                <Badge className="bg-white/15 text-white border-0 backdrop-blur-sm px-3 py-1 text-xs font-medium">
                                    <DollarSign className="w-3 h-3 mr-1.5" /> Rs. {tenant.rent?.toLocaleString()}/mo
                                </Badge>
                                <Badge className="bg-white/15 text-white border-0 backdrop-blur-sm px-3 py-1 text-xs font-medium">
                                    <Clock className="w-3 h-3 mr-1.5" /> Since {createdDate}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-3 md:grid-cols-4">
                <StatCard icon={<Calendar className="w-4 h-4 text-cyan-400" />} label="Total Bills" value={totalBills} color="cyan" />
                <StatCard icon={<DollarSign className="w-4 h-4 text-slate-400" />} label="Total Expected" value={`Rs. ${totalExpected.toLocaleString()}`} color="slate" />
                <StatCard icon={<Activity className="w-4 h-4 text-emerald-400" />} label="Total Paid" value={`Rs. ${totalPaid.toLocaleString()}`} color="emerald" />
                <StatCard icon={<Wallet className="w-4 h-4" style={{ color: totalDue > 0 ? '#fb923c' : '#34d399' }} />} label={totalDue > 0 ? "Overall Due" : "All Clear"} value={`Rs. ${totalDue.toLocaleString()}`} color={totalDue > 0 ? "orange" : "emerald"} />
            </div>

            {/* Bill History */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-white">Bill History</h2>
                        <p className="text-xs text-slate-500">Monthly breakdown for {tenant.name}</p>
                    </div>
                    {availableMonths.length > 0 && (
                        <div className="bg-[#1e293b] border border-white/[0.06] rounded-xl px-1 py-0.5 shadow-sm">
                            <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
                                <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[160px] h-8 text-sm text-white">
                                    <SelectValue>{selectedMonthLabel}</SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                    <SelectItem value="ALL">All Months</SelectItem>
                                    {availableMonths.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {sortedMonths.length > 0 ? (
                    sortedMonths.map(monthKey => {
                        const monthBills = groupedBills[monthKey];
                        const totalExp = monthBills.reduce((a, b) => a + (b.total || 0), 0);
                        const totalPd = monthBills.reduce((a, b) => a + (b.paidAmount || 0), 0);
                        const totalRem = totalExp - totalPd;

                        return (
                            <div key={monthKey} className="space-y-2">
                                {/* Month Header */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-white/[0.06]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                            <Calendar className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="font-bold text-white text-sm">{monthKey}</h3>
                                    </div>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-slate-300">Total: <strong className="text-white">Rs. {totalExp.toLocaleString()}</strong></span>
                                        <span className="text-emerald-400">Paid: <strong>Rs. {totalPd.toLocaleString()}</strong></span>
                                        {totalRem > 0 && <span className="text-orange-400">Due: <strong>Rs. {totalRem.toLocaleString()}</strong></span>}
                                    </div>
                                </div>

                                {/* Bills Table */}
                                <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0f172a]/50">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="hover:bg-transparent border-b border-white/[0.06] bg-white/[0.02]">
                                                    <TableHead className="pl-5 py-2.5 text-[10px] uppercase tracking-wider font-semibold text-slate-500">Rent</TableHead>
                                                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Units</TableHead>
                                                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Electricity</TableHead>
                                                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Water</TableHead>
                                                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Prev Due</TableHead>
                                                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Total</TableHead>
                                                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Paid</TableHead>
                                                    <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {monthBills.map(b => (
                                                    <TableRow key={b._id} className="hover:bg-white/[0.03] border-b border-white/[0.04]">
                                                        <TableCell className="pl-5 text-sm text-slate-300">Rs. {b.rent?.toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <span className="font-bold text-white text-sm">{b.usedUnit}</span>
                                                            <span className="text-[10px] text-slate-500 ml-1">({b.prevUnit}→{b.currUnit})</span>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-slate-300">Rs. {b.electricityCost?.toLocaleString()}</TableCell>
                                                        <TableCell className="text-sm text-slate-300">Rs. {(b.water || 0)?.toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            {b.previousDue > 0
                                                                ? <span className="text-orange-400 font-medium text-sm">Rs. {b.previousDue.toLocaleString()}</span>
                                                                : <span className="text-slate-600">—</span>}
                                                        </TableCell>
                                                        <TableCell className="font-bold text-white text-sm">Rs. {b.total?.toLocaleString()}</TableCell>
                                                        <TableCell>
                                                            <span className="text-sm text-slate-300">Rs. {b.paidAmount?.toLocaleString() || 0}</span>
                                                            {b.paidAmount > 0 && (
                                                                <div className="flex gap-1 mt-0.5">
                                                                    {(b.cashAmount > 0) && <Badge className="text-[8px] bg-emerald-500/15 text-emerald-400 border-0 px-1 py-0">C:{b.cashAmount}</Badge>}
                                                                    {(b.onlineAmount > 0) && <Badge className="text-[8px] bg-blue-500/15 text-blue-400 border-0 px-1 py-0">O:{b.onlineAmount}</Badge>}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {b.remaining > 0 ? (
                                                                <div>
                                                                    <span className="text-orange-400 font-bold text-sm">Rs. {b.remaining.toLocaleString()}</span>
                                                                    <span className="block text-[9px] text-orange-500/60 uppercase font-semibold">Due</span>
                                                                </div>
                                                            ) : (
                                                                <Badge className="bg-emerald-500/15 text-emerald-400 border-0 shadow-none px-2 py-0.5 font-semibold text-[11px]">✓ Paid</Badge>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="rounded-2xl border border-white/[0.06] bg-[#0f172a]/50 text-center py-16 flex flex-col items-center">
                        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 rounded-full mb-4 border border-white/[0.06]">
                            <Calendar className="w-10 h-10 text-cyan-400" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No bills found</h3>
                        <p className="text-slate-400 text-sm max-w-sm">
                            {selectedMonthFilter !== "ALL" ? "No bills for this month." : "No bills generated yet."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    const borderColors = {
        cyan: "border-cyan-500/10",
        slate: "border-white/[0.06]",
        emerald: "border-emerald-500/10",
        orange: "border-orange-500/10",
    };
    const bgColors = {
        cyan: "bg-cyan-500/10",
        slate: "bg-white/5",
        emerald: "bg-emerald-500/10",
        orange: "bg-orange-500/10",
    };
    const textColors = {
        cyan: "text-white",
        slate: "text-white",
        emerald: "text-emerald-400",
        orange: "text-orange-400",
    };
    return (
        <div className={`rounded-xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border ${borderColors[color]} p-4`}>
            <div className={`w-9 h-9 rounded-lg ${bgColors[color]} flex items-center justify-center mb-3`}>
                {icon}
            </div>
            <p className={`text-xl font-bold ${textColors[color]}`}>{value}</p>
            <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-medium">{label}</p>
        </div>
    );
}
