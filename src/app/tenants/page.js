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
                <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 md:p-8 border border-white/[0.06]">
                <div className="absolute top-0 right-0 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="relative flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Tenants</h1>
                        <p className="text-slate-400 mt-1 text-sm">Manage your tenants and properties.</p>
                    </div>

                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold shadow-lg shadow-cyan-500/25 border-0 transition-all rounded-xl">
                                <Plus className="w-5 h-5 mr-2" /> Add Tenant
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0f172a] border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold text-white">Add New Tenant</DialogTitle>
                                <DialogDescription className="text-slate-400">Fill out the details of the new tenant.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAdd} className="space-y-4 py-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</Label>
                                    <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" className="bg-white/5 border-white/10 text-white h-10 rounded-xl placeholder:text-slate-600" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room / Flat / Unit</Label>
                                    <Input required value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} placeholder="3B" className="bg-white/5 border-white/10 text-white h-10 rounded-xl placeholder:text-slate-600" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Base Rent (Rs.)</Label>
                                    <Input required type="number" value={formData.rent} onChange={e => setFormData({ ...formData, rent: e.target.value })} placeholder="15000" className="bg-white/5 border-white/10 text-white h-10 rounded-xl placeholder:text-slate-600" />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold border-0 rounded-xl shadow-lg shadow-cyan-500/25">Save Tenant</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Tenants Table */}
            <div className="rounded-2xl overflow-hidden border border-white/[0.06] bg-gradient-to-br from-[#0f172a] to-[#1e293b]">
                {tenants.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-white/[0.06] bg-white/[0.02]">
                                <TableHead className="pl-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Tenant</TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Room</TableHead>
                                <TableHead className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Monthly Rent</TableHead>
                                <TableHead className="text-right pr-5 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {tenants.map((t) => (
                                <TableRow key={t._id} className="group transition-colors hover:bg-white/[0.03] border-b border-white/[0.04]">
                                    <TableCell className="pl-5">
                                        <Link href={`/tenants/${t._id}`} className="flex items-center gap-3 group/link">
                                            <Avatar className="w-9 h-9 border border-white/10">
                                                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold text-xs">
                                                    {t.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-semibold text-white group-hover/link:text-cyan-400 transition-colors text-sm">
                                                {t.name}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 text-slate-600 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs font-mono text-slate-400 bg-white/5 px-2 py-1 rounded-md">Room {t.room}</span>
                                    </TableCell>
                                    <TableCell className="font-bold text-white text-sm">Rs. {t.rent.toLocaleString()}</TableCell>
                                    <TableCell className="text-right pr-5 space-x-0.5">
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); openEdit(t); }} className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 hover:bg-white/10">
                                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); handleDelete(t._id); }} className="opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-opacity h-7 w-7">
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-24 flex flex-col items-center">
                        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 rounded-full mb-4 border border-white/[0.06]">
                            <Users className="w-12 h-12 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No tenants yet</h3>
                        <p className="text-slate-400 text-sm">Add a new tenant to get started.</p>
                    </div>
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-[#0f172a] border-white/10 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-white">Edit Tenant</DialogTitle>
                        <DialogDescription className="text-slate-400">Update tenant information or base rent.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</Label>
                            <Input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10 text-white h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Room / Flat / Unit</Label>
                            <Input required value={formData.room} onChange={e => setFormData({ ...formData, room: e.target.value })} className="bg-white/5 border-white/10 text-white h-10 rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Base Rent (Rs.)</Label>
                            <Input required type="number" value={formData.rent} onChange={e => setFormData({ ...formData, rent: e.target.value })} className="bg-white/5 border-white/10 text-white h-10 rounded-xl" />
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold border-0 rounded-xl shadow-lg shadow-cyan-500/25">Update Tenant</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
