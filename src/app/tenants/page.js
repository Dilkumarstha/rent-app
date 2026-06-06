"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Users, ArrowRight } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function TenantsPage() {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", room: "", rent: "" });
    const [editId, setEditId] = useState(null);

    const fetchTenants = async () => {
        try {
            const res = await fetch("/api/tenants").then(r => r.json());
            if (res.success) setTenants(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    useEffect(() => { fetchTenants(); }, []);

    const handleAdd = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/tenants", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, rent: Number(formData.rent) })
        }).then(r => r.json());
        if (res.success) { setIsAddOpen(false); setFormData({ name: "", room: "", rent: "" }); fetchTenants(); }
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        const res = await fetch(`/api/tenants/${editId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...formData, rent: Number(formData.rent) })
        }).then(r => r.json());
        if (res.success) { setIsEditOpen(false); setFormData({ name: "", room: "", rent: "" }); setEditId(null); fetchTenants(); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure? This will delete all bills as well.")) return;
        const res = await fetch(`/api/tenants/${id}`, { method: "DELETE" }).then(r => r.json());
        if (res.success) fetchTenants();
    };

    const openEdit = (tenant) => {
        setEditId(tenant._id);
        setFormData({ name: tenant.name, room: tenant.room, rent: tenant.rent });
        setIsEditOpen(true);
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-52 rounded-xl" />
                <Skeleton className="h-80 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 px-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Tenants <span className="text-primary italic ml-1">Directory</span>
                    </h1>
                    <p className="text-muted-foreground mt-1 font-medium flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Total of <span className="text-primary font-bold">{tenants.length}</span> households registered
                    </p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                            <Plus className="w-5 h-5 stroke-[2.5]" /> Add New Resident
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-white border-slate-200 rounded-xl max-w-md shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-foreground">New Resident</DialogTitle>
                            <DialogDescription className="text-muted-foreground font-medium">Register a new tenant to the system.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAdd} className="space-y-4 py-4">
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Full Identity</Label>
                                <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Snow" className="border-slate-200 text-foreground h-11 rounded-lg px-4 font-medium focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Property Reference</Label>
                                <Input required value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="Flat 402" className="border-slate-200 text-foreground h-11 rounded-lg px-4 font-medium focus-visible:ring-primary" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Base Monthly Rent (Rs.)</Label>
                                <Input required type="number" value={formData.rent} onChange={e => setFormData({ ...formData, rent: e.target.value })} placeholder="25000" className="border-slate-200 text-foreground h-11 rounded-lg px-4 font-medium focus-visible:ring-primary" />
                            </div>
                            <DialogFooter className="pt-4">
                                <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold h-11 rounded-lg border-0 shadow-md">Create Tenant Profile</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Tenants Table */}
            <div className="rounded-xl glass-card overflow-hidden">
                {tenants.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-b border-slate-100 bg-slate-50/50">
                                    <TableHead className="pl-6 py-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Resident</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Property</TableHead>
                                    <TableHead className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Monthly Base</TableHead>
                                    <TableHead className="text-right pr-6 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">Controls</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenants.map((t) => (
                                    <TableRow key={t._id} className="hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100">
                                        <TableCell className="pl-6 py-4">
                                            <Link href={`/tenants/${t._id}`} className="flex items-center gap-4 group/link">
                                                <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-xs uppercase">
                                                        {t.name.substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <span className="font-bold text-foreground group-hover/link:text-primary transition-colors block text-sm leading-tight">
                                                        {t.name}
                                                    </span>
                                                    <span className="text-[9px] uppercase font-bold text-muted-foreground/50 tracking-widest block mt-0.5">Resident</span>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                {t.room}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-bold text-foreground text-sm tracking-tight px-4">
                                            Rs. {t.rent.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); openEdit(t); }} className="h-8 w-8 rounded-lg hover:bg-slate-100 text-muted-foreground transition-colors">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleDelete(t._id); }} className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 text-muted-foreground transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                                <Link href={`/tenants/${t._id}`}>
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-white transition-all ml-1">
                                                        <ArrowRight className="w-4 h-4" />
                                                    </div>
                                                </Link>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-24 flex flex-col items-center">
                        <div className="bg-slate-50 p-8 rounded-xl mb-4 border border-slate-200">
                            <Users className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-1">Neighborhood is Empty</h3>
                        <p className="text-muted-foreground font-medium text-sm">Add your first tenant to populate the building.</p>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-white border-slate-200 rounded-xl max-w-md shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-foreground">Edit Listing</DialogTitle>
                        <DialogDescription className="text-muted-foreground font-medium">Update tenant details or rental agreement.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Full Identity</Label>
                            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border-slate-200 text-foreground h-11 rounded-lg px-4 font-medium focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Property Reference</Label>
                            <Input required value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="border-slate-200 text-foreground h-11 rounded-lg px-4 font-medium focus-visible:ring-primary" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider pl-1">Monthly Base Rent (Rs.)</Label>
                            <Input required type="number" value={formData.rent} onChange={e => setFormData({ ...formData, rent: e.target.value })} className="border-slate-200 text-foreground h-11 rounded-lg px-4 font-medium focus-visible:ring-primary" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold h-11 rounded-lg border-0 shadow-md">Update Profile</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
