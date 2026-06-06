"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, Receipt, Edit2, Calendar, Filter, Zap, Droplets, Wallet, X, ArrowRight, Printer } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

const NEPALI_MONTHS = [
    "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

// Dynamically generate a range of Nepali years (current Gregorian year + 57)
const currentGregorianYear = new Date().getFullYear();
const currentNepaliYear = currentGregorianYear + 57;
const NEPALI_YEARS = Array.from({ length: 15 }, (_, i) => (currentNepaliYear - 5 + i).toString());

// Helper to get tenant display name
function getTenantLabel(tenants, id) {
    const t = tenants.find(t => t._id === id);
    return t ? `${t.name} — Room ${t.room}` : "";
}

export default function BillsPage() {
    const [bills, setBills] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Pay Due state
    const [isPayDueOpen, setIsPayDueOpen] = useState(false);
    const [payDueFormData, setPayDueFormData] = useState({ cashAmount: "", onlineAmount: "", billId: null });

    const [selectedTenantFilter, setSelectedTenantFilter] = useState("ALL");
    const [selectedMonthFilter, setSelectedMonthFilter] = useState("ALL");
    const [selectedYearFilter, setSelectedYearFilter] = useState("ALL");
    const [editingBillId, setEditingBillId] = useState(null);

    const initialForm = {
        tenantId: "",
        bsMonth: NEPALI_MONTHS[0],
        bsYear: currentNepaliYear.toString(),
        prevUnit: "",
        currUnit: "",
        unitPrice: "10",
        water: "0",
        cashAmount: "",
        onlineAmount: "",
        remarks: ""
    };

    const [formData, setFormData] = useState(initialForm);

    const fetchData = async () => {
        try {
            const [b, t] = await Promise.all([
                fetch("/api/bills").then(r => r.json()),
                fetch("/api/tenants").then(r => r.json()),
            ]);
            if (b.success) setBills(b.data);
            if (t.success) setTenants(t.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchData(); }, []);

    // Get previous due for a tenant
    const getPreviousDue = useCallback((tenantId) => {
        const lastBill = bills.find(b => b.tenantId?._id === tenantId);
        return lastBill ? (lastBill.remaining || 0) : 0;
    }, [bills]);

    // Get tenant's rent
    const getTenantRent = useCallback((tenantId) => {
        const t = tenants.find(t => t._id === tenantId);
        return t ? t.rent : 0;
    }, [tenants]);

    const handleTenantSelect = useCallback((tenantId) => {
        setFormData(prev => {
            const lastBill = bills.find(b => b.tenantId?._id === tenantId);
            return {
                ...prev,
                tenantId,
                prevUnit: lastBill ? (lastBill.currUnit?.toString() || "0") : "0"
            };
        });
    }, [bills]);

    const handleFormChange = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const openEdit = (bill) => {
        setEditingBillId(bill._id);
        let bsMonth = NEPALI_MONTHS[0];
        let bsYear = currentNepaliYear.toString();
        if (bill.month?.includes(" ")) {
            const parts = bill.month.split(" ");
            if (parts.length === 2) { bsMonth = parts[0]; bsYear = parts[1]; }
        }
        setFormData({
            tenantId: bill.tenantId?._id || "",
            bsMonth, bsYear,
            prevUnit: bill.prevUnit?.toString() || "",
            currUnit: bill.currUnit?.toString() || "",
            unitPrice: bill.unitPrice?.toString() || "10",
            water: bill.water?.toString() || "0",
            cashAmount: bill.cashAmount?.toString() || "0",
            onlineAmount: bill.onlineAmount?.toString() || "0",
            previousDue: bill.previousDue || 0,
            remarks: bill.remarks || ""
        });
        setIsEditOpen(true);
    };

    const submitBill = async (e, isEditing) => {
        e.preventDefault();
        if (!formData.tenantId) return alert("Select a tenant first.");

        if (Number(formData.currUnit) < Number(formData.prevUnit)) {
            return alert("Current Unit cannot be less than Previous Unit.");
        }

        const formattedMonth = `${formData.bsMonth} ${formData.bsYear}`;
        const payload = {
            tenantId: formData.tenantId,
            month: formattedMonth,
            prevUnit: Number(formData.prevUnit) || 0,
            currUnit: Number(formData.currUnit) || 0,
            unitPrice: Number(formData.unitPrice) || 10,
            water: Number(formData.water) || 0,
            cashAmount: Number(formData.cashAmount) || 0,
            onlineAmount: Number(formData.onlineAmount) || 0,
            remarks: formData.remarks
        };

        const url = isEditing ? `/api/bills/${editingBillId}` : "/api/bills";
        const method = isEditing ? "PUT" : "POST";

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }).then(r => r.json());

        if (res.success) {
            if (isEditing) setIsEditOpen(false);
            else setIsGenerateOpen(false);
            setFormData(initialForm);
            setEditingBillId(null);
            fetchData();
        } else {
            alert("Error: " + res.error);
        }
    };

    const submitPayDue = async (e) => {
        e.preventDefault();
        const bill = bills.find(b => b._id === payDueFormData.billId);
        if (!bill) return;

        const newCash = Number(payDueFormData.cashAmount) || 0;
        const newOnline = Number(payDueFormData.onlineAmount) || 0;

        const totalCash = (bill.cashAmount || 0) + newCash;
        const totalOnline = (bill.onlineAmount || 0) + newOnline;

        // the PUT endpoint handles calculating the total remaining appropriately based on input payments
        const res = await fetch(`/api/bills/${bill._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cashAmount: totalCash, onlineAmount: totalOnline })
        }).then(r => r.json());

        if (res.success) {
            setIsPayDueOpen(false);
            setPayDueFormData({ cashAmount: "", onlineAmount: "", billId: null });
            fetchData();
        } else {
            alert("Error: " + res.error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this bill?")) return;
        const res = await fetch(`/api/bills/${id}`, { method: "DELETE" }).then(r => r.json());
        if (res.success) fetchData();
    };

    // Filtering
    const filteredBills = bills.filter(b => {
        const matchesTenant = selectedTenantFilter === "ALL" || b.tenantId?._id === selectedTenantFilter;
        let matchesMonth = true;
        let matchesYear = true;
        if (selectedMonthFilter !== "ALL" || selectedYearFilter !== "ALL") {
            const parts = b.month?.split(" ") || [];
            if (selectedMonthFilter !== "ALL") matchesMonth = parts[0] === selectedMonthFilter;
            if (selectedYearFilter !== "ALL") matchesYear = parts[1] === selectedYearFilter;
        }
        return matchesTenant && matchesMonth && matchesYear;
    });

    // Group by month
    const groupedBills = {};
    filteredBills.forEach(b => {
        const key = b.month || "Unknown";
        if (!groupedBills[key]) groupedBills[key] = [];
        groupedBills[key].push(b);
    });

    const sortedMonthKeys = Object.keys(groupedBills).sort((a, b) => {
        const [mA, yA] = a.split(" ");
        const [mB, yB] = b.split(" ");
        if (yA !== yB) return Number(yB) - Number(yA);
        return NEPALI_MONTHS.indexOf(mB) - NEPALI_MONTHS.indexOf(mA);
    });

    const getMonthStats = (monthBills) => {
        const totalExpected = monthBills.reduce((a, b) => a + ((b.rent || 0) + (b.electricityCost || 0) + (b.water || 0)), 0);
        const totalPaid = monthBills.reduce((a, b) => a + (b.paidAmount || 0), 0);
        return { totalExpected, totalPaid, totalDue: totalExpected - totalPaid, count: monthBills.length };
    };

    // Filter display helpers
    const tenantFilterLabel = selectedTenantFilter === "ALL" ? "All Tenants" : getTenantLabel(tenants, selectedTenantFilter);
    const monthFilterLabel = selectedMonthFilter === "ALL" ? "All Months" : selectedMonthFilter;
    const yearFilterLabel = selectedYearFilter === "ALL" ? "All Years" : selectedYearFilter;

    if (loading) {
        return (
            <div className="space-y-6 p-4 md:p-8 max-w-7xl mx-auto">
                <Skeleton className="h-10 w-64 rounded-xl" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
                </div>
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 max-w-7xl mx-auto p-4 md:p-8">
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-800">
                        Bills & <span className="text-primary italic">Transactions</span>
                    </h1>
                    <p className="text-muted-foreground mt-1.5 text-sm font-medium flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary" />
                        Managing <span className="text-slate-800 font-bold">{bills.length}</span> financial records
                    </p>
                </div>
                <Dialog open={isGenerateOpen} onOpenChange={(val) => {
                    if (val) setFormData(initialForm);
                    setIsGenerateOpen(val);
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-primary text-white px-6 h-12 rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-all flex items-center gap-2">
                            <Plus className="w-5 h-5" /> Generate Bill
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl overflow-y-auto max-h-[95vh] bg-white border-slate-200 rounded-xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-slate-800">New Invoice</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium">Calculate readings and record payments for this month.</DialogDescription>
                        </DialogHeader>
                        <BillFormContent
                            isEditing={false}
                            formData={formData}
                            onFormChange={handleFormChange}
                            onTenantSelect={handleTenantSelect}
                            tenants={tenants}
                            bills={bills}
                            getPreviousDue={getPreviousDue}
                            getTenantRent={getTenantRent}
                            onSubmit={(e) => submitBill(e, false)}
                            onCancel={() => setIsGenerateOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* ── Filters ── */}
            {bills.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-2">
                        <Filter className="w-3.5 h-3.5" /> Filters
                    </div>

                    <FilterPill>
                        <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                            <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[160px] h-9 text-xs font-bold text-slate-700">
                                <SelectValue>{tenantFilterLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 rounded-lg shadow-lg">
                                <SelectItem value="ALL" className="font-bold text-xs">All Tenants</SelectItem>
                                {tenants.map(t => (
                                    <SelectItem key={t._id} value={t._id} className="font-bold text-xs">{t.name} — {t.room}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterPill>

                    <FilterPill>
                        <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
                            <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[120px] h-9 text-xs font-bold text-slate-700">
                                <SelectValue>{monthFilterLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 rounded-lg shadow-lg">
                                <SelectItem value="ALL" className="font-bold text-xs">All Months</SelectItem>
                                {NEPALI_MONTHS.map(m => (
                                    <SelectItem key={m} value={m} className="font-bold text-xs">{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterPill>

                    <FilterPill>
                        <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
                            <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[90px] h-9 text-xs font-bold text-slate-700">
                                <SelectValue>{yearFilterLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 rounded-lg shadow-lg">
                                <SelectItem value="ALL" className="font-bold text-xs">All Years</SelectItem>
                                {NEPALI_YEARS.map(y => (
                                    <SelectItem key={y} value={y} className="font-bold text-xs">{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterPill>

                    {(selectedTenantFilter !== "ALL" || selectedMonthFilter !== "ALL" || selectedYearFilter !== "ALL") && (
                        <Button
                            variant="ghost"
                            onClick={() => { setSelectedTenantFilter("ALL"); setSelectedMonthFilter("ALL"); setSelectedYearFilter("ALL"); }}
                            className="h-9 px-3 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-1.5 ml-auto"
                        >
                            <X className="w-3.5 h-3.5" /> Reset
                        </Button>
                    )}
                </div>
            )}

            {/* ── Monthly Grouped Bills ── */}
            {sortedMonthKeys.length > 0 ? (
                sortedMonthKeys.map(monthKey => {
                    const monthBills = groupedBills[monthKey];
                    const stats = getMonthStats(monthBills);

                    return (
                        <div key={monthKey} className="space-y-4">
                            {/* Month Header */}
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">{monthKey}</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stats.count} statement{stats.count !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <StatChip label="Expected" value={`Rs. ${stats.totalExpected.toLocaleString()}`} color="slate" />
                                    <StatChip label="Collected" value={`Rs. ${stats.totalPaid.toLocaleString()}`} color="accent" />
                                    {stats.totalDue > 0 && <StatChip label="Pending" value={`Rs. ${stats.totalDue.toLocaleString()}`} color="orange" />}
                                </div>
                            </div>

                            {/* Bills Table Container */}
                            <div className="rounded-xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
                                                <TableHead className="pl-6 py-4 text-[9px] uppercase tracking-wider font-bold text-slate-400">Occupant</TableHead>
                                                <TableHead className="text-[9px] uppercase tracking-wider font-bold text-slate-400 text-center">Units</TableHead>
                                                <TableHead className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Breakdown</TableHead>
                                                <TableHead className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Total Invoice</TableHead>
                                                <TableHead className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Payment</TableHead>
                                                <TableHead className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Status</TableHead>
                                                <TableHead className="text-right pr-6 text-[9px] uppercase tracking-wider font-bold text-slate-400">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {monthBills.map((b) => {
                                                const currentDeficit = b.tenantId ? getPreviousDue(b.tenantId._id) : 0;
                                                const isHistoricallySettled = b.remaining > 0 && currentDeficit <= 0;

                                                return (
                                                    <TableRow key={b._id} className="group transition-all hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
                                                        <TableCell className="pl-6 py-4">
                                                            {b.tenantId ? (
                                                                <Link href={`/tenants/${b.tenantId._id}`} className="block">
                                                                    <span className="font-bold text-slate-800 hover:text-primary transition-colors text-sm block">{b.tenantId.name}</span>
                                                                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Room {b.tenantId.room}</span>
                                                                </Link>
                                                            ) : <span className="text-red-500 font-medium italic text-xs">Resident Removed</span>}
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="inline-flex flex-col items-center">
                                                                <span className="font-bold text-slate-700 text-sm">{b.usedUnit}</span>
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase">{b.prevUnit}-{b.currUnit}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" /> Rent: Rs. {b.rent?.toLocaleString()}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                                    <span className="w-1 h-1 rounded-full bg-slate-300" /> Elec: Rs. {b.electricityCost?.toLocaleString()}
                                                                </div>
                                                                {b.water > 0 && (
                                                                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                                                        <span className="w-1 h-1 rounded-full bg-slate-300" /> Water: Rs. {b.water?.toLocaleString()}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-bold text-slate-800 text-sm tabular-nums">
                                                                Rs. {b.total < 0 ? '0' : b.total?.toLocaleString()}
                                                            </span>
                                                            {b.previousDue !== 0 && (
                                                                <span className={cn(
                                                                    "block text-[8px] font-bold uppercase tracking-wider mt-0.5",
                                                                    b.previousDue > 0 ? "text-orange-500" : "text-blue-500"
                                                                )}>
                                                                    {b.previousDue > 0 ? `+ Rs ${b.previousDue} Due` : `- Rs ${Math.abs(b.previousDue)} Pre`}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-1">
                                                                {(b.cashAmount > 0 || b.onlineAmount > 0) ? (
                                                                    <div className="flex flex-col gap-1">
                                                                        {b.cashAmount > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 w-fit">Cash Rs. {b.cashAmount.toLocaleString()}</span>}
                                                                        {b.onlineAmount > 0 && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 w-fit">Online Rs. {b.onlineAmount.toLocaleString()}</span>}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[9px] font-bold text-red-500 uppercase">Unpaid</span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isHistoricallySettled ? (
                                                                <Badge className="bg-accent/10 text-accent border-0 font-bold px-2 py-0.5 rounded text-[9px] tracking-wider uppercase">Settled</Badge>
                                                            ) : b.remaining > 0 ? (
                                                                <span className="text-orange-500 font-bold text-xs">Rs. {b.remaining.toLocaleString()}</span>
                                                            ) : b.remaining < 0 ? (
                                                                <span className="text-blue-500 font-bold text-xs">-Rs. {Math.abs(b.remaining).toLocaleString()}</span>
                                                            ) : (
                                                                <Badge className="bg-accent/10 text-accent border-0 font-bold px-2 py-0.5 rounded text-[9px] tracking-wider uppercase">Paid</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6 whitespace-nowrap">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {b.remaining > 0 && !isHistoricallySettled && (
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => { setPayDueFormData({ cashAmount: "", onlineAmount: "", billId: b._id }); setIsPayDueOpen(true); }}
                                                                        className="h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-sm transition-all"
                                                                    >
                                                                        Pay
                                                                    </Button>
                                                                )}
                                                                <Link href={`/bills/${b._id}/print`} target="_blank">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 text-slate-400 hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all">
                                                                        <Printer className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </Link>
                                                                <Button variant="ghost" size="icon" onClick={() => openEdit(b)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(b._id)} className="h-8 w-8 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all">
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        </div>
                    );
                })
            ) : (
                <div className="rounded-[2.5rem] glass-card text-center py-32 flex flex-col items-center shadow-2xl shadow-indigo-500/5">
                    <div className="bg-indigo-50 p-10 rounded-[2.5rem] mb-6 border border-indigo-100">
                        <Receipt className="w-16 h-16 text-indigo-400 stroke-[1]" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1.5">No Records Found</h3>
                    <p className="text-muted-foreground font-bold max-w-sm mb-8 leading-relaxed">
                        {selectedTenantFilter !== "ALL" || selectedMonthFilter !== "ALL" || selectedYearFilter !== "ALL"
                            ? "We couldn't find any invoices matching your current active filters."
                            : "Your financial history starts here. Create your first ever bill for a tenant."}
                    </p>
                    {selectedTenantFilter === "ALL" && selectedMonthFilter === "ALL" && selectedYearFilter === "ALL" && (
                        <button onClick={() => setIsGenerateOpen(true)} className="bg-primary text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-primary/90 transition-all">
                            Start Billing Process
                        </button>
                    )}
                </div>
            )}

            {/* Pay Due Dialog */}
            <Dialog open={isPayDueOpen} onOpenChange={setIsPayDueOpen}>
                <DialogContent className="max-w-md bg-white border-slate-200 rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Wallet className="w-6 h-6 text-orange-500" />
                            Record Payment
                        </DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">
                            Input formal payment for the outstanding month balance.
                        </DialogDescription>
                    </DialogHeader>
                    {payDueFormData.billId && bills.find(b => b._id === payDueFormData.billId) && (
                        <form onSubmit={submitPayDue} className="space-y-6 pt-4">
                            {(() => {
                                const b = bills.find(b => b._id === payDueFormData.billId);
                                return (
                                    <>
                                        <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Pending Balance</span>
                                            <span className="text-2xl font-bold text-orange-600 tabular-nums">Rs. {b.remaining.toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider pl-1">Cash In</Label>
                                                <Input
                                                    type="number"
                                                    onWheel={(e) => e.target.blur()}
                                                    value={payDueFormData.cashAmount}
                                                    onChange={e => setPayDueFormData({ ...payDueFormData, cashAmount: e.target.value })}
                                                    placeholder="0"
                                                    className="bg-slate-50 border-slate-200 h-10 rounded-lg px-3 font-bold focus-visible:ring-primary"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wider pl-1">Online</Label>
                                                <Input
                                                    type="number"
                                                    onWheel={(e) => e.target.blur()}
                                                    value={payDueFormData.onlineAmount}
                                                    onChange={e => setPayDueFormData({ ...payDueFormData, onlineAmount: e.target.value })}
                                                    placeholder="0"
                                                    className="bg-slate-50 border-slate-200 h-10 rounded-lg px-3 font-bold focus-visible:ring-primary"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter className="pt-2">
                                            <Button type="submit" className="w-full bg-primary text-white font-bold h-11 rounded-lg">Record Receipt</Button>
                                        </DialogFooter>
                                    </>
                                );
                            })()}
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[95vh] bg-white border-slate-200 rounded-xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-slate-800">Update Ledger</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">Fix errors in payments, meter readings, or notes.</DialogDescription>
                    </DialogHeader>
                    <BillFormContent
                        isEditing={true}
                        formData={formData}
                        onFormChange={handleFormChange}
                        onTenantSelect={handleTenantSelect}
                        tenants={tenants}
                        bills={bills}
                        getPreviousDue={getPreviousDue}
                        getTenantRent={getTenantRent}
                        onSubmit={(e) => submitBill(e, true)}
                        onCancel={() => setIsEditOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ── Reusable small components ──

function FilterPill({ children }) {
    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex items-center">
            {children}
        </div>
    );
}

function StatChip({ label, value, color }) {
    const colors = {
        slate: "bg-slate-50 border-slate-100 text-slate-600",
        accent: "bg-accent/10 border-accent/20 text-accent",
        orange: "bg-orange-50 border-orange-100 text-orange-600",
        cyan: "bg-blue-50 border-blue-100 text-blue-600",
    };
    return (
        <div className={cn("text-center px-4 py-1.5 rounded-lg border", colors[color])}>
            <p className="text-[8px] uppercase tracking-wider font-bold opacity-70 mb-0.5">{label}</p>
            <p className="font-bold text-sm tabular-nums">{value}</p>
        </div>
    );
}

// ── Bill Form ──
function BillFormContent({ isEditing, formData, onFormChange, onTenantSelect, tenants, bills, getPreviousDue, getTenantRent, onSubmit, onCancel }) {
    const selectedTenant = tenants.find(t => t._id === formData.tenantId);
    const tenantDisplayLabel = selectedTenant ? `${selectedTenant.name} (${selectedTenant.room})` : "Select a resident";
    const tenantRent = selectedTenant ? selectedTenant.rent : 0;
    const previousDue = formData.tenantId ? (isEditing ? (formData.previousDue || 0) : getPreviousDue(formData.tenantId)) : 0;

    // Live calculations
    const prevUnit = Number(formData.prevUnit) || 0;
    const currUnit = Number(formData.currUnit) || 0;
    const usedUnit = Math.max(0, currUnit - prevUnit);
    const unitPrice = Number(formData.unitPrice) || 10;
    const electricityCost = usedUnit * unitPrice;
    const waterCost = Number(formData.water) || 0;
    const totalBeforeDue = tenantRent + electricityCost + waterCost;
    const grandTotal = totalBeforeDue + previousDue;
    const cashAmt = Number(formData.cashAmount) || 0;
    const onlineAmt = Number(formData.onlineAmount) || 0;
    const totalPaid = cashAmt + onlineAmt;
    const remainingToPay = grandTotal - totalPaid;

    return (
        <form
            onSubmit={onSubmit}
            onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.tagName === "INPUT") {
                    e.preventDefault();
                    e.target.blur();
                }
            }}
            className="space-y-6 py-4"
        >
            {/* Row 1: Tenant + Month */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pl-1">Primary Occupant</Label>
                    <Select disabled={isEditing} value={formData.tenantId} onValueChange={isEditing ? undefined : onTenantSelect}>
                        <SelectTrigger className="bg-slate-50 border-slate-200 h-11 w-full text-slate-700 rounded-lg px-4 font-bold focus:ring-primary">
                            <SelectValue>{tenantDisplayLabel}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-white border-slate-200 rounded-lg shadow-xl">
                            {tenants.map(t => (
                                <SelectItem key={t._id} value={t._id} className="font-bold text-sm">{t.name} ({t.room})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pl-1">Billing Cycle (BS)</Label>
                    <div className="flex gap-3">
                        <Select value={formData.bsMonth} onValueChange={v => onFormChange("bsMonth", v)}>
                            <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11 text-slate-700 rounded-lg px-4 font-bold focus:ring-primary"><SelectValue>{formData.bsMonth}</SelectValue></SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 rounded-lg shadow-xl">
                                {NEPALI_MONTHS.map(m => (<SelectItem key={m} value={m} className="font-bold text-sm">{m}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <Select value={formData.bsYear} onValueChange={v => onFormChange("bsYear", v)}>
                            <SelectTrigger className="w-full bg-slate-50 border-slate-200 h-11 text-slate-700 rounded-lg px-4 font-bold focus:ring-primary"><SelectValue>{formData.bsYear}</SelectValue></SelectTrigger>
                            <SelectContent className="bg-white border-slate-200 rounded-lg shadow-xl">
                                {NEPALI_YEARS.map(y => (<SelectItem key={y} value={y} className="font-bold text-sm">{y}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Tenant Info Cards */}
            {formData.tenantId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-800 p-4 flex items-center gap-4 text-white">
                        <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-[9px] text-white/50 uppercase font-bold tracking-tight">Base Rent</p>
                            <p className="text-lg font-bold tabular-nums">Rs. {tenantRent.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={cn(
                        "rounded-xl p-4 flex items-center gap-4 border",
                        previousDue > 0 ? "bg-orange-50 border-orange-100 text-orange-600" :
                            previousDue < 0 ? "bg-blue-50 border-blue-100 text-blue-600" :
                                "bg-slate-50 border-slate-200 text-slate-600"
                    )}>
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            previousDue > 0 ? "bg-orange-100" : previousDue < 0 ? "bg-blue-100" : "bg-slate-200/50"
                        )}>
                            <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-bold tracking-tight opacity-60">
                                {previousDue > 0 ? 'Due Balance' : previousDue < 0 ? 'Credit' : 'Clear'}
                            </p>
                            <p className="text-lg font-bold tabular-nums">
                                Rs. {Math.abs(previousDue).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Readings Section */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-tight">Utility Readings</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pl-1">Prev Units</Label>
                        <Input required type="number" onWheel={(e) => e.target.blur()} value={formData.prevUnit} onChange={e => onFormChange("prevUnit", e.target.value)} className="bg-slate-50 border-slate-200 h-11 rounded-lg px-4 font-bold focus:ring-primary" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pl-1">Curr Units</Label>
                        <Input
                            required
                            type="number"
                            onWheel={(e) => e.target.blur()}
                            min={formData.prevUnit}
                            value={formData.currUnit}
                            onChange={e => onFormChange("currUnit", e.target.value)}
                            onBlur={() => {
                                if (Number(formData.currUnit) < Number(formData.prevUnit)) {
                                    onFormChange("currUnit", formData.prevUnit);
                                }
                            }}
                            className="bg-slate-50 border-slate-200 h-11 rounded-lg px-4 font-bold focus:ring-primary"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pl-1">Unit Price</Label>
                        <Input type="number" onWheel={(e) => e.target.blur()} value={formData.unitPrice} onChange={e => onFormChange("unitPrice", e.target.value)} className="bg-slate-50 border-slate-200 h-11 rounded-lg px-4 font-bold focus:ring-primary" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pl-1 flex items-center gap-1.5">Water Fee</Label>
                        <Input type="number" onWheel={(e) => e.target.blur()} value={formData.water} onChange={e => onFormChange("water", e.target.value)} className="bg-slate-50 border-slate-200 h-11 rounded-lg px-4 font-bold focus:ring-primary" />
                    </div>
                </div>
            </div>

            {/* Statement Summary Breakdown */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 space-y-4">
                <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-2">Statement Summary</h4>
                <div className="space-y-2 font-bold text-sm text-slate-700">
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="text-slate-400 text-xs">Monthly Rent</span>
                        <span className="tabular-nums">Rs. {tenantRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="text-slate-400 text-xs">Electricity ({usedUnit} units @ {unitPrice})</span>
                        <span className="tabular-nums">Rs. {electricityCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm">
                        <span className="text-slate-400 text-xs">Water Consumption</span>
                        <span className="tabular-nums">Rs. {waterCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 px-1">
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Subtotal</span>
                        <span className="font-bold text-slate-800">Rs. {totalBeforeDue.toLocaleString()}</span>
                    </div>
                    {previousDue !== 0 && (
                        <div className={cn(
                            "flex justify-between items-center pt-1 px-1",
                            previousDue > 0 ? "text-orange-500" : "text-blue-500"
                        )}>
                            <span className="font-bold uppercase text-[10px] tracking-wider">{previousDue > 0 ? 'Due Balance' : 'Advance Credit'}</span>
                            <span className="font-bold tabular-nums">{previousDue > 0 ? '+' : '-'} Rs. {Math.abs(previousDue).toLocaleString()}</span>
                        </div>
                    )}
                    <div className="h-px bg-slate-200 my-4" />
                    <div className="flex justify-between items-center px-1">
                        <span className="text-base font-bold text-slate-800 uppercase tracking-tight">Total Invoice</span>
                        <div className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-bold text-lg tabular-nums">
                            Rs. {grandTotal < 0 ? '0' : grandTotal.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Section */}
            <div className="space-y-4 pt-2">
                <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-xs text-slate-800 uppercase tracking-tight">Immediate Payment</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight pl-1">Cash Payment</Label>
                        <Input type="number" onWheel={(e) => e.target.blur()} value={formData.cashAmount} onChange={e => onFormChange("cashAmount", e.target.value)} placeholder="0" className="bg-slate-50 border-slate-200 h-11 rounded-lg px-4 font-bold focus:ring-primary" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-tight pl-1">Online Payment</Label>
                        <Input type="number" onWheel={(e) => e.target.blur()} value={formData.onlineAmount} onChange={e => onFormChange("onlineAmount", e.target.value)} placeholder="0" className="bg-slate-50 border-slate-200 h-11 rounded-lg px-4 font-bold focus:ring-primary" />
                    </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-700">
                    <span className="font-bold uppercase text-[10px] tracking-wider">Total Received Today</span>
                    <span className="font-bold text-xl tabular-nums tracking-tight">Rs. {totalPaid.toLocaleString()}</span>
                </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight pl-1">Internal Remarks</Label>
                <Input value={formData.remarks} onChange={e => onFormChange("remarks", e.target.value)} placeholder="Late payment, repair adjustment, etc." className="bg-slate-50 border-slate-200 h-11 rounded-lg px-4 font-bold focus:ring-primary" />
            </div>

            {/* Final Balance Insight */}
            {remainingToPay !== 0 && formData.tenantId && (
                <div className={cn(
                    "p-3 rounded-lg border flex items-center gap-3 transition-all",
                    remainingToPay > 0 ? "bg-orange-50 border-orange-100" : "bg-blue-50 border-blue-100"
                )}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", remainingToPay > 0 ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600")}>
                        {remainingToPay > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div>
                        <p className="text-[11px] font-bold leading-tight text-slate-800">
                            {remainingToPay > 0
                                ? `Warning: Rs. ${remainingToPay.toLocaleString()} will be carried over as DUE.`
                                : `Notice: Rs. ${Math.abs(remainingToPay).toLocaleString()} will be applied as ADVANCE.`
                            }
                        </p>
                    </div>
                </div>
            )}

            <DialogFooter className="pt-6 gap-3">
                <Button type="button" variant="ghost" onClick={onCancel} className="h-11 px-6 rounded-lg font-bold text-slate-400 hover:bg-slate-100">Discard</Button>
                <Button type="submit" className="h-11 px-10 bg-primary text-white font-bold rounded-lg shadow-sm hover:bg-primary/90 flex-1 md:flex-none">
                    {isEditing ? 'Sync Changes' : 'Confirm & Generate'}
                </Button>
            </DialogFooter>
        </form>
    );
}

// Ensure these are imported at the top, but adding here as a fallback if not imported
import { AlertCircle, CheckCircle2 } from "lucide-react";
