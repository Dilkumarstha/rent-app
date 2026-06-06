"use client"
import { useEffect, useState, use } from "react";
import { ArrowLeft, Calendar, Home, DollarSign, Activity, Clock, Edit2, Wallet, Zap, Droplets, Receipt, CheckCircle2, AlertCircle } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
            <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Resident Not Found</h2>
                <p className="text-muted-foreground mb-8 max-w-xs text-sm">The requested resident records are missing or have been permanently moved.</p>
                <Link href="/tenants">
                    <Button className="bg-primary text-white font-bold px-8 h-12 rounded-xl shadow-sm">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
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
    const selectedMonthLabel = selectedMonthFilter === "ALL" ? "Full History" : selectedMonthFilter;

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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24 max-w-7xl mx-auto p-4 md:p-8">
            <header className="flex items-center justify-between">
                <Link href="/tenants">
                    <Button variant="ghost" className="text-primary hover:bg-primary/5 rounded-xl h-10 px-4 font-bold flex items-center gap-2 transition-all">
                        <ArrowLeft className="w-4 h-4" /> Directory
                    </Button>
                </Link>
                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Last Update</p>
                        <p className="text-sm font-black text-slate-800">{new Date().toLocaleDateString()}</p>
                    </div>
                </div>
            </header>

            {/* Profile Hero */}
            <div className="glass-card relative overflow-hidden rounded-xl">
                <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start md:justify-between gap-10">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="relative">
                            <Avatar className="w-20 h-20 md:w-24 md:h-24 rounded-xl border border-slate-200 shadow-sm shadow-slate-200/50 bg-white">
                                <AvatarFallback className="bg-slate-100 text-slate-700 text-2xl md:text-3xl font-bold">
                                    {tenant.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>

                        <div className="text-center md:text-left space-y-2">
                            <div>
                                <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider rounded mb-2 border border-slate-200">Resident Profile</span>
                                <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-tight leading-tight">{tenant.name}</h1>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                    <Home className="w-3.5 h-3.5 text-primary" />
                                    <span className="text-xs font-bold text-slate-700">Room {tenant.room}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                    <DollarSign className="w-3.5 h-3.5 text-accent" />
                                    <span className="text-xs font-bold text-slate-700">Rs. {tenant.rent?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-bold text-slate-700">Joined {createdDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <StatCard icon={<Calendar className="w-5 h-5 text-indigo-600" />} label="Total Bills" value={totalBills} color="indigo" />
                <StatCard icon={<Receipt className="w-5 h-5 text-blue-600" />} label="Expected" value={`Rs. ${totalExpected.toLocaleString()}`} color="blue" />
                <StatCard icon={<CheckCircle2 className="w-5 h-5 text-accent" />} label="Actual Paid" value={`Rs. ${totalPaid.toLocaleString()}`} color="accent" />
                <StatCard
                    icon={totalDue > 0 ? <AlertCircle className="w-5 h-5 text-orange-600" /> : <Wallet className="w-5 h-5 text-accent" />}
                    label={totalDue > 0 ? "Liability" : "Balance"}
                    value={`Rs. ${totalDue.toLocaleString()}`}
                    color={totalDue > 0 ? "orange" : "accent"}
                    highlight={totalDue > 0}
                />
            </div>

            {/* Timeline & Bills */}
            <div className="space-y-6 pt-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Statement Timeline</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-0.5">Historical Breakdown</p>
                    </div>
                    {availableMonths.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                            <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
                                <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[160px] h-9 font-bold text-slate-700 text-sm">
                                    <SelectValue>{selectedMonthLabel}</SelectValue>
                                </SelectTrigger>
                                <SelectContent className="bg-white border-slate-200 rounded-lg">
                                    <SelectItem value="ALL" className="font-bold text-sm">Full History</SelectItem>
                                    {availableMonths.map(m => (<SelectItem key={m} value={m} className="font-bold text-sm">{m}</SelectItem>))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {sortedMonths.length > 0 ? (
                    <div className="space-y-12 relative pt-2">
                        {/* Timeline Stem */}
                        <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-100 via-indigo-50 to-transparent hidden md:block" />

                        {sortedMonths.map(monthKey => {
                            const monthBills = groupedBills[monthKey];
                            const totalExp = monthBills.reduce((a, b) => a + (b.total || 0), 0);
                            const totalPd = monthBills.reduce((a, b) => a + (b.paidAmount || 0), 0);
                            const totalRem = totalExp - totalPd;

                            return (
                                <div key={monthKey} className="relative md:pl-12 animate-in fade-in slide-in-from-left-4 duration-500">
                                    {/* Timeline Node */}
                                    <div className="absolute left-[3px] top-4 w-2 h-2 bg-primary rounded-full z-10 hidden md:block" />

                                    <div className="space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between bg-white border border-slate-200 p-4 rounded-xl shadow-sm gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-slate-800">{monthKey}</h3>
                                                    <div className="flex gap-4 mt-0.5">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-slate-300" /> {monthBills.length} Entry
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Invoiced</p>
                                                    <p className="font-bold text-slate-700 text-sm">Rs. {totalExp.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold text-accent uppercase tracking-widest mb-0.5">Paid</p>
                                                    <p className="font-bold text-accent text-sm">Rs. {totalPd.toLocaleString()}</p>
                                                </div>
                                                {totalRem > 0 && (
                                                    <div className="text-right col-span-2 lg:col-span-1">
                                                        <p className="text-[9px] font-bold text-orange-500 uppercase tracking-widest mb-0.5">Pending</p>
                                                        <p className="font-bold text-orange-600 text-sm">Rs. {totalRem.toLocaleString()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-xl overflow-hidden border border-slate-100 bg-white shadow-sm">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
                                                        <TableHead className="pl-6 py-4 text-[9px] uppercase font-bold tracking-widest text-slate-400">Rent Body</TableHead>
                                                        <TableHead className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Elec. (Unit)</TableHead>
                                                        <TableHead className="text-[9px] uppercase font-bold tracking-widest text-slate-400 text-center">Water</TableHead>
                                                        <TableHead className="text-[9px] uppercase font-bold tracking-widest text-slate-400 text-right">Invoice</TableHead>
                                                        <TableHead className="text-[9px] uppercase font-bold tracking-widest text-slate-400 text-right">Settled</TableHead>
                                                        <TableHead className="text-[9px] uppercase font-bold tracking-widest text-slate-400 text-right pr-6">Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {monthBills.map(b => (
                                                        <TableRow key={b._id} className="hover:bg-slate-50 border-b border-slate-100 last:border-0 group transition-colors">
                                                            <TableCell className="pl-6 py-4">
                                                                <p className="font-bold text-slate-700 text-sm">Rs. {b.rent?.toLocaleString()}</p>
                                                                {b.previousDue !== 0 && (
                                                                    <p className={cn("text-[9px] font-bold uppercase mt-0.5", b.previousDue > 0 ? "text-orange-500" : "text-blue-500")}>
                                                                        {b.previousDue > 0 ? "+" : "-"} Rs. {Math.abs(b.previousDue).toLocaleString()}
                                                                    </p>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                                                                    <div>
                                                                        <p className="font-bold text-slate-700 text-xs">{b.usedUnit} Units</p>
                                                                        <p className="text-[9px] font-bold text-slate-400 uppercase">{b.prevUnit}-{b.currUnit}</p>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-center font-bold text-slate-600 text-sm">Rs. {b.water || 0}</TableCell>
                                                            <TableCell className="text-right">
                                                                <p className="font-bold text-slate-800 text-sm tabular-nums tracking-tight">Rs. {b.total?.toLocaleString()}</p>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <p className="font-bold text-accent text-sm tabular-nums">Rs. {b.paidAmount.toLocaleString()}</p>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-6">
                                                                {b.remaining > 0 ? (
                                                                    <div className="flex flex-col items-end">
                                                                        <div className="flex items-center gap-1 text-orange-500 font-bold text-xs uppercase tracking-tight">
                                                                            Rs. {b.remaining.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <Badge className="bg-accent/10 text-accent border-0 font-bold px-2 py-0.5 rounded text-[9px] tracking-wider uppercase">
                                                                        Paid
                                                                    </Badge>
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
                        })}
                    </div>
                ) : (
                    <div className="glass-card bg-white/50 border-indigo-100 rounded-[2.5rem] p-20 text-center flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                            <Receipt className="w-10 h-10 text-indigo-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 italic">No Bills Recorded</h3>
                        <p className="text-muted-foreground mt-2 max-w-sm font-medium">We couldn't find any financial statements matching the current filter criteria for this resident.</p>
                        {selectedMonthFilter !== "ALL" && (
                            <Button variant="link" onClick={() => setSelectedMonthFilter("ALL")} className="mt-4 text-indigo-600 font-black">View all history</Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, highlight = false }) {
    const colors = {
        indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        accent: "bg-accent/10 text-accent border-accent/20",
        orange: "bg-orange-50 text-orange-600 border-orange-100",
    };

    return (
        <div className={cn(
            "rounded-xl p-5 border shadow-sm bg-white",
            highlight && "border-orange-200 bg-orange-50/10"
        )}>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-4", colors[color])}>
                {icon}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={cn("text-xl font-bold tracking-tight mt-1 truncate", highlight && "text-orange-600")}>{value}</p>
        </div>
    );
}
