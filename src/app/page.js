"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Activity, ArrowRight, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [tenantsRes, billsRes] = await Promise.all([
          fetch("/api/tenants").then((r) => r.json()),
          fetch("/api/bills").then((r) => r.json()),
        ]);
        if (tenantsRes.success) setTenants(tenantsRes.data);
        if (billsRes.success) setBills(billsRes.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const currentMonth = bills.length > 0 ? bills[0].month : "N/A";
  const currentMonthBills = bills.filter((b) => b.month === currentMonth);
  const totalExpectedThisMonth = currentMonthBills.reduce((acc, bill) => acc + ((bill.rent || 0) + (bill.electricityCost || 0) + (bill.water || 0)), 0);
  const totalReceivedThisMonth = currentMonthBills.reduce((acc, bill) => acc + (bill.paidAmount || 0), 0);
  const remainingExpected = currentMonthBills.reduce((acc, bill) => acc + (bill.remaining || 0), 0);

  const getTenantMonthStats = (tenantId) => {
    const tenantBills = currentMonthBills.filter(b => b.tenantId?._id === tenantId);
    if (tenantBills.length === 0) return { paid: 0, due: 0, total: 0, hasBill: false };
    const total = tenantBills.reduce((acc, b) => acc + (b.total || 0), 0);
    const paid = tenantBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    return { paid, due: tenantBills.reduce((acc, b) => acc + (b.remaining || 0), 0), total, hasBill: true };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-52 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const paymentPercentage = totalExpectedThisMonth > 0 ? Math.round((totalReceivedThisMonth / totalExpectedThisMonth) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-12 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hey, <span className="text-primary italic">Manager</span>
          </h1>
          <p className="text-muted-foreground mt-1 font-medium flex items-center gap-2">
            Here is a quick summary for <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-xs font-semibold border border-indigo-100">{currentMonth}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl glass-card text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Live Overview
          </div>
          <Link href="/bills/new">
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-opacity">
              Create Bill
            </button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <Badge variant="outline" className="text-indigo-600 border-indigo-200 font-semibold">Expected</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">Rs. {totalExpectedThisMonth.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{currentMonthBills.length} active bills</p>
          </div>
        </div>

        <div className="rounded-xl glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-accent" />
            </div>
            <Badge className="bg-accent text-accent-foreground font-semibold">Received</Badge>
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground tabular-nums tracking-tight">Rs. {totalReceivedThisMonth.toLocaleString()}</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${paymentPercentage}%` }} />
              </div>
              <span className="text-xs text-muted-foreground font-bold">{paymentPercentage}%</span>
            </div>
          </div>
        </div>

        <div className={cn(
          "rounded-xl glass-card p-6",
          remainingExpected > 0 ? "border-orange-200" : "border-blue-200"
        )}>
          <div className="flex items-center justify-between mb-4">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              remainingExpected > 0 ? "bg-orange-50 text-orange-600" : "bg-blue-50 text-blue-600"
            )}>
              <Wallet className="h-6 w-6" />
            </div>
            <Badge className={cn(
              "font-semibold",
              remainingExpected > 0 ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-blue-50 text-blue-600 border-blue-100"
            )}>
              {remainingExpected < 0 ? 'Advance' : 'Due'}
            </Badge>
          </div>
          <div>
            <p className={cn(
              "text-2xl font-bold tabular-nums tracking-tight",
              remainingExpected > 0 ? "text-orange-600" : "text-blue-600"
            )}>
              Rs. {Math.abs(remainingExpected).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {remainingExpected > 0 ? 'Pending collection' : remainingExpected < 0 ? 'Outstanding credit' : 'All cleared ✨'}
            </p>
          </div>
        </div>
      </div>

      {/* Tenants List */}
      <div className="rounded-xl glass-card overflow-hidden">
        <div className="p-6 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Active Tenants</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">Managing {tenants.length} household{tenants.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/tenants">
            <button className="flex items-center gap-2 group text-primary font-bold text-xs bg-primary/5 px-4 py-2 rounded-lg border border-primary/10 hover:bg-primary/10 transition-colors">
              Directory <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
        </div>

        <div className="p-4 space-y-3">
          {tenants.length === 0 && (
            <div className="p-12 text-center bg-muted/30 rounded-3xl border-2 border-dashed border-muted">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="font-bold text-muted-foreground">Add your first tenant to see them here.</p>
            </div>
          )}
          {tenants.map(tenant => {
            const stats = getTenantMonthStats(tenant._id);
            return (
              <Link key={tenant._id} href={`/tenants/${tenant._id}`}>
                <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group border-b last:border-0 border-slate-100">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm ring-1 ring-slate-100">
                      <AvatarFallback className="bg-slate-100 text-slate-600 font-bold text-sm">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-none">
                        {tenant.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">{tenant.room}</span>
                        <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                          <DollarSign className="w-3 h-3" /> {tenant.rent.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {stats.hasBill ? (
                      <>
                        <div className="hidden sm:block text-right">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Paid</p>
                          <p className="text-sm font-bold text-slate-800">Rs. {stats.paid.toLocaleString()}</p>
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">{stats.due < 0 ? 'Advance' : 'Due Balance'}</p>
                          <div className={cn(
                            "inline-block px-2 py-1 rounded-md font-bold text-xs",
                            stats.due > 0 ? "bg-orange-50 text-orange-600 border border-orange-100" : stats.due < 0 ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-accent/10 text-accent"
                          )}>
                            {stats.due > 0 ? `Rs. ${stats.due.toLocaleString()}` : stats.due < 0 ? `Rs. ${Math.abs(stats.due).toLocaleString()}` : 'Cleared ✓'}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                        Pending Actions
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ArrowRight className="w-5 h-5 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
