"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, Receipt, Edit2, Calendar, Filter, Zap, Droplets, Wallet, X, ArrowRight } from "lucide-react";
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

const NEPALI_MONTHS = [
    "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
    "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
];

const NEPALI_YEARS = ["2080", "2081", "2082", "2083", "2084", "2085"];

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
    const [selectedTenantFilter, setSelectedTenantFilter] = useState("ALL");
    const [selectedMonthFilter, setSelectedMonthFilter] = useState("ALL");
    const [selectedYearFilter, setSelectedYearFilter] = useState("ALL");
    const [editingBillId, setEditingBillId] = useState(null);

    const initialForm = {
        tenantId: "",
        bsMonth: NEPALI_MONTHS[0],
        bsYear: "2081",
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
        let bsYear = "2081";
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
            remarks: bill.remarks || ""
        });
        setIsEditOpen(true);
    };

    const submitBill = async (e, isEditing) => {
        e.preventDefault();
        if (!formData.tenantId) return alert("Select a tenant first.");

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
        const totalExpected = monthBills.reduce((a, b) => a + (b.total || 0), 0);
        const totalPaid = monthBills.reduce((a, b) => a + (b.paidAmount || 0), 0);
        return { totalExpected, totalPaid, totalDue: totalExpected - totalPaid, count: monthBills.length };
    };

    // Filter display helpers
    const tenantFilterLabel = selectedTenantFilter === "ALL" ? "All Tenants" : getTenantLabel(tenants, selectedTenantFilter);
    const monthFilterLabel = selectedMonthFilter === "ALL" ? "All Months" : selectedMonthFilter;
    const yearFilterLabel = selectedYearFilter === "ALL" ? "All Years" : selectedYearFilter;

    if (loading) {
        return (
            <div className="space-y-6 p-2">
                <Skeleton className="h-12 w-72 rounded-xl" />
                <div className="grid gap-4 md:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
                </div>
                <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* ── Page Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 md:p-8 border border-white/[0.06]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
                <div className="relative flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">
                            Bills & Invoices
                        </h1>
                        <p className="text-slate-400 mt-1 text-sm">Manage monthly bills, view payment statuses, and adjust balances.</p>
                    </div>
                    <Dialog open={isGenerateOpen} onOpenChange={(val) => {
                        if (val) setFormData(initialForm);
                        setIsGenerateOpen(val);
                    }}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold shadow-lg shadow-cyan-500/25 border-0 transition-all hover:shadow-cyan-400/30 rounded-xl">
                                <Plus className="w-5 h-5 mr-2" /> New Bill
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] bg-[#0f172a] border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-white">Generate New Bill</DialogTitle>
                                <DialogDescription className="text-slate-400">Input electricity readings and payment. The app calculates everything else.</DialogDescription>
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
            </div>

            {/* ── Filters ── */}
            {bills.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                        <Filter className="w-3.5 h-3.5" /> Filters
                    </div>

                    <FilterPill label={tenantFilterLabel}>
                        <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                            <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[160px] h-8 text-sm text-white">
                                <SelectValue>{tenantFilterLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                <SelectItem value="ALL">All Tenants</SelectItem>
                                {tenants.map(t => (
                                    <SelectItem key={t._id} value={t._id}>{t.name} — {t.room}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterPill>

                    <FilterPill label={monthFilterLabel}>
                        <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
                            <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[120px] h-8 text-sm text-white">
                                <SelectValue>{monthFilterLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                <SelectItem value="ALL">All Months</SelectItem>
                                {NEPALI_MONTHS.map(m => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterPill>

                    <FilterPill label={yearFilterLabel}>
                        <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
                            <SelectTrigger className="border-0 shadow-none focus:ring-0 bg-transparent min-w-[80px] h-8 text-sm text-white">
                                <SelectValue>{yearFilterLabel}</SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                <SelectItem value="ALL">All Years</SelectItem>
                                {NEPALI_YEARS.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FilterPill>

                    {(selectedTenantFilter !== "ALL" || selectedMonthFilter !== "ALL" || selectedYearFilter !== "ALL") && (
                        <button
                            onClick={() => { setSelectedTenantFilter("ALL"); setSelectedMonthFilter("ALL"); setSelectedYearFilter("ALL"); }}
                            className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 ml-1"
                        >
                            <X className="w-3 h-3" /> Clear
                        </button>
                    )}
                </div>
            )}

            {/* ── Monthly Grouped Bills ── */}
            {sortedMonthKeys.length > 0 ? (
                sortedMonthKeys.map(monthKey => {
                    const monthBills = groupedBills[monthKey];
                    const stats = getMonthStats(monthBills);

                    return (
                        <div key={monthKey} className="space-y-3">
                            {/* Month Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] border border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                        <Calendar className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-white">{monthKey}</h2>
                                        <p className="text-xs text-slate-500">{stats.count} bill{stats.count !== 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 text-sm">
                                    <StatChip label="Expected" value={`Rs. ${stats.totalExpected.toLocaleString()}`} color="slate" />
                                    <StatChip label="Received" value={`Rs. ${stats.totalPaid.toLocaleString()}`} color="emerald" />
                                    {stats.totalDue > 0 && <StatChip label="Due" value={`Rs. ${stats.totalDue.toLocaleString()}`} color="orange" />}
                                </div>
                            </div>

                            {/* Bills Table */}
                            <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0f172a]/50">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent border-b border-white/[0.06] bg-white/[0.02]">
                                                <TableHead className="pl-5 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Tenant</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Units</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Electricity</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Water</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Total</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Paid</TableHead>
                                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Status</TableHead>
                                                <TableHead className="text-right pr-5 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {monthBills.map((b) => (
                                                <TableRow key={b._id} className="group transition-colors hover:bg-white/[0.03] border-b border-white/[0.04]">
                                                    <TableCell className="pl-5">
                                                        {b.tenantId ? (
                                                            <Link href={`/tenants/${b.tenantId._id}`} className="group/link">
                                                                <span className="font-semibold text-white group-hover/link:text-cyan-400 transition-colors text-sm">{b.tenantId.name}</span>
                                                                <span className="block text-[11px] text-slate-500 mt-0.5">Room {b.tenantId.room}</span>
                                                            </Link>
                                                        ) : <span className="text-red-400 text-xs italic">Removed</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-bold text-white text-sm">{b.usedUnit?.toLocaleString()}</span>
                                                        <span className="block text-[10px] text-slate-500">{b.prevUnit}→{b.currUnit}</span>
                                                    </TableCell>
                                                    <TableCell><span className="text-slate-300 text-sm">Rs. {b.electricityCost?.toLocaleString()}</span></TableCell>
                                                    <TableCell><span className="text-slate-300 text-sm">Rs. {(b.water || 0)?.toLocaleString()}</span></TableCell>
                                                    <TableCell>
                                                        <span className="font-bold text-white text-sm">Rs. {b.total?.toLocaleString()}</span>
                                                        {b.previousDue > 0 && <span className="block text-[10px] text-orange-400">+Due: Rs {b.previousDue}</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-slate-300 text-sm">Rs. {b.paidAmount?.toLocaleString() || 0}</span>
                                                        {b.paidAmount > 0 && (
                                                            <div className="flex gap-1 mt-1">
                                                                {(b.cashAmount > 0) && <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border-0 px-1.5 py-0">Cash: {b.cashAmount}</Badge>}
                                                                {(b.onlineAmount > 0) && <Badge className="text-[9px] bg-blue-500/15 text-blue-400 border-0 px-1.5 py-0">Online: {b.onlineAmount}</Badge>}
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {b.remaining > 0 ? (
                                                            <div>
                                                                <span className="text-orange-400 font-bold text-sm">Rs. {b.remaining.toLocaleString()}</span>
                                                                <span className="block text-[10px] text-orange-500/60 uppercase font-semibold tracking-wider">Due</span>
                                                            </div>
                                                        ) : (
                                                            <Badge className="bg-emerald-500/15 text-emerald-400 border-0 shadow-none px-2.5 py-1 font-semibold text-xs">✓ Paid</Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-5 space-x-0.5">
                                                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)} className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 hover:bg-white/10">
                                                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(b._id)} className="opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-opacity h-7 w-7">
                                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                        </Button>
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
                <div className="rounded-2xl border border-white/[0.06] bg-[#0f172a]/50 text-center py-24 flex flex-col items-center">
                    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 rounded-full mb-4 border border-white/[0.06]">
                        <Receipt className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No bills found</h3>
                    <p className="text-slate-400 max-w-sm mb-6 text-sm">
                        {selectedTenantFilter !== "ALL" || selectedMonthFilter !== "ALL" || selectedYearFilter !== "ALL"
                            ? "No bills match your filters. Try adjusting them."
                            : "You haven't generated any bills yet."}
                    </p>
                    {selectedTenantFilter === "ALL" && selectedMonthFilter === "ALL" && selectedYearFilter === "ALL" && (
                        <Button onClick={() => setIsGenerateOpen(true)} className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold border-0 rounded-xl shadow-lg shadow-cyan-500/25">
                            <Plus className="w-4 h-4 mr-2" /> Generate First Bill
                        </Button>
                    )}
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh] bg-[#0f172a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white">Modify Bill</DialogTitle>
                        <DialogDescription className="text-slate-400">Update payments, units, or remarks.</DialogDescription>
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
        <div className="bg-[#1e293b] border border-white/[0.06] rounded-xl px-1 py-0.5 shadow-sm">
            {children}
        </div>
    );
}

function StatChip({ label, value, color }) {
    const colors = {
        slate: "bg-white/5 border-white/[0.06] text-white",
        emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
    };
    return (
        <div className={`text-center px-3.5 py-1.5 rounded-xl border ${colors[color]}`}>
            <p className="text-[10px] uppercase tracking-wider font-medium opacity-60">{label}</p>
            <p className="font-bold text-sm">{value}</p>
        </div>
    );
}

// ── Bill Form ──
function BillFormContent({ isEditing, formData, onFormChange, onTenantSelect, tenants, bills, getPreviousDue, getTenantRent, onSubmit, onCancel }) {
    const selectedTenant = tenants.find(t => t._id === formData.tenantId);
    const tenantDisplayLabel = selectedTenant ? `${selectedTenant.name} (${selectedTenant.room})` : "Select tenant";
    const tenantRent = selectedTenant ? selectedTenant.rent : 0;
    const previousDue = formData.tenantId ? getPreviousDue(formData.tenantId) : 0;

    // Live calculations
    const prevUnit = Number(formData.prevUnit) || 0;
    const currUnit = Number(formData.currUnit) || 0;
    const usedUnit = currUnit - prevUnit;
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
        <form onSubmit={onSubmit} className="space-y-5 py-2">
            {/* ── Row 1: Tenant + Month ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant</Label>
                    <Select disabled={isEditing} value={formData.tenantId} onValueChange={isEditing ? undefined : onTenantSelect}>
                        <SelectTrigger className="bg-white/5 border-white/10 h-10 text-white rounded-xl">
                            <SelectValue>{tenantDisplayLabel}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                            {tenants.map(t => (
                                <SelectItem key={t._id} value={t._id}>{t.name} ({t.room})</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nepali Month & Year</Label>
                    <div className="flex gap-2">
                        <Select value={formData.bsMonth} onValueChange={v => onFormChange("bsMonth", v)}>
                            <SelectTrigger className="w-full bg-white/5 border-white/10 h-10 text-white rounded-xl"><SelectValue>{formData.bsMonth}</SelectValue></SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                {NEPALI_MONTHS.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                            </SelectContent>
                        </Select>
                        <Select value={formData.bsYear} onValueChange={v => onFormChange("bsYear", v)}>
                            <SelectTrigger className="w-full bg-white/5 border-white/10 h-10 text-white rounded-xl"><SelectValue>{formData.bsYear}</SelectValue></SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                {NEPALI_YEARS.map(y => (<SelectItem key={y} value={y}>{y}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* ── Tenant Info Cards (Rent + Previous Due) ── */}
            {formData.tenantId && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                            <p className="text-[10px] text-cyan-400 uppercase tracking-wider font-medium">Monthly Rent</p>
                            <p className="text-lg font-bold text-white">Rs. {tenantRent.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className={`rounded-xl p-3 flex items-center gap-3 ${previousDue > 0 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${previousDue > 0 ? 'bg-orange-500/20' : 'bg-emerald-500/20'}`}>
                            <Receipt className={`w-4 h-4 ${previousDue > 0 ? 'text-orange-400' : 'text-emerald-400'}`} />
                        </div>
                        <div>
                            <p className={`text-[10px] uppercase tracking-wider font-medium ${previousDue > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>Previous Due</p>
                            <p className={`text-lg font-bold ${previousDue > 0 ? 'text-orange-300' : 'text-emerald-300'}`}>Rs. {previousDue.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Electricity Section ── */}
            <div className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <h4 className="font-semibold text-sm text-white">Electricity</h4>
                    {!isEditing && formData.tenantId && (
                        <span className="text-[10px] text-slate-500 ml-auto">Previous unit auto-fetched</span>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Previous Unit</Label>
                        <Input required type="number" value={formData.prevUnit} onChange={e => onFormChange("prevUnit", e.target.value)} placeholder="e.g. 150" className="bg-white/5 border-white/10 text-white h-10 rounded-xl placeholder:text-slate-600" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Current Unit</Label>
                        <Input required type="number" value={formData.currUnit} onChange={e => onFormChange("currUnit", e.target.value)} placeholder="e.g. 210" className="bg-white/5 border-white/10 text-white h-10 rounded-xl placeholder:text-slate-600" />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Unit Price (Rs.)</Label>
                        <Input type="number" value={formData.unitPrice} onChange={e => onFormChange("unitPrice", e.target.value)} className="bg-white/5 border-white/10 text-white h-10 rounded-xl" />
                    </div>
                    <div className="space-y-1 flex items-center gap-2">
                        <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Droplets className="w-3 h-3 text-blue-400" />
                                <Label className="text-[11px] text-slate-400">Water (Rs.)</Label>
                            </div>
                            <Input type="number" value={formData.water} onChange={e => onFormChange("water", e.target.value)} className="bg-white/5 border-white/10 text-white h-10 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Total Amount Breakdown ── */}
            <div className="rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.02] border border-white/[0.08] p-4 space-y-2">
                <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider mb-3">Bill Summary</h4>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-300">
                        <span>Base Rent</span>
                        <span className="font-medium">Rs. {tenantRent.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                        <span>Electricity ({usedUnit} units × Rs. {unitPrice})</span>
                        <span className="font-medium">Rs. {electricityCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                        <span>Water</span>
                        <span className="font-medium">Rs. {waterCost.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-white/[0.06] my-2" />
                    <div className="flex justify-between text-white font-semibold">
                        <span>Subtotal</span>
                        <span>Rs. {totalBeforeDue.toLocaleString()}</span>
                    </div>
                    {previousDue > 0 && (
                        <div className="flex justify-between text-orange-400">
                            <span>+ Previous Due</span>
                            <span className="font-medium">Rs. {previousDue.toLocaleString()}</span>
                        </div>
                    )}
                    <div className="border-t border-white/[0.06] my-2" />
                    <div className="flex justify-between text-lg">
                        <span className="font-bold text-white">Grand Total</span>
                        <span className="font-bold text-cyan-400">Rs. {grandTotal.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* ── Payment Section ── */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                        <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <h4 className="font-semibold text-sm text-white">Payment</h4>
                    {isEditing && (
                        <span className="text-[10px] text-orange-400 ml-auto">Increase amounts to clear remaining debt</span>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <Label className="text-[11px] text-emerald-400 flex items-center gap-1">
                            💵 Cash Amount
                        </Label>
                        <Input
                            type="number"
                            value={formData.cashAmount}
                            onChange={e => onFormChange("cashAmount", e.target.value)}
                            placeholder="0"
                            className="bg-emerald-500/5 border-emerald-500/20 text-white h-10 rounded-xl placeholder:text-slate-600 focus:border-emerald-500/40"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-blue-400 flex items-center gap-1">
                            📱 Online Amount
                        </Label>
                        <Input
                            type="number"
                            value={formData.onlineAmount}
                            onChange={e => onFormChange("onlineAmount", e.target.value)}
                            placeholder="0"
                            className="bg-blue-500/5 border-blue-500/20 text-white h-10 rounded-xl placeholder:text-slate-600 focus:border-blue-500/40"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] text-slate-400">Remaining</Label>
                        <div className={`h-10 rounded-xl flex items-center px-3 font-bold text-sm border ${remainingToPay > 0
                                ? 'bg-orange-500/10 border-orange-500/20 text-orange-400'
                                : remainingToPay === 0
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            }`}>
                            Rs. {remainingToPay.toLocaleString()}
                        </div>
                    </div>
                </div>

                {/* Total paid summary */}
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.02] rounded-lg px-3 py-2 border border-white/[0.04]">
                    <span>Total Paid:</span>
                    <span className="font-bold text-white">Rs. {totalPaid.toLocaleString()}</span>
                    <span className="ml-auto">of Rs. {grandTotal.toLocaleString()}</span>
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden ml-1">
                        <div
                            className={`h-full rounded-full transition-all ${totalPaid >= grandTotal ? 'bg-emerald-400' : 'bg-cyan-400'}`}
                            style={{ width: `${Math.min((totalPaid / (grandTotal || 1)) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* ── Remarks ── */}
            <div className="space-y-1">
                <Label className="text-[11px] text-slate-400">Remarks (Notes)</Label>
                <Input value={formData.remarks} onChange={e => onFormChange("remarks", e.target.value)} placeholder="e.g. Partial payment. Will pay rest next week." className="bg-white/5 border-white/10 text-white h-10 rounded-xl placeholder:text-slate-600" />
            </div>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <Button type="button" variant="outline" onClick={onCancel} className="border-white/10 text-slate-300 hover:bg-white/5 rounded-xl">Cancel</Button>
                <Button type="submit" className="px-8 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold border-0 rounded-xl shadow-lg shadow-cyan-500/25">
                    {isEditing ? "Update Bill" : "Generate & Save"}
                </Button>
            </div>
        </form>
    );
}
