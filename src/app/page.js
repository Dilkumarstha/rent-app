"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Activity, ArrowRight, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

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
  const totalExpectedThisMonth = currentMonthBills.reduce((acc, bill) => acc + (bill.total || 0), 0);
  const totalReceivedThisMonth = currentMonthBills.reduce((acc, bill) => acc + (bill.paidAmount || 0), 0);
  const remainingExpected = totalExpectedThisMonth - totalReceivedThisMonth;

  const getTenantMonthStats = (tenantId) => {
    const tenantBills = currentMonthBills.filter(b => b.tenantId?._id === tenantId);
    if (tenantBills.length === 0) return { paid: 0, due: 0, total: 0, hasBill: false };
    const total = tenantBills.reduce((acc, b) => acc + (b.total || 0), 0);
    const paid = tenantBills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    return { paid, due: total - paid, total, hasBill: true };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-52 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const paymentPercentage = totalExpectedThisMonth > 0 ? Math.round((totalReceivedThisMonth / totalExpectedThisMonth) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] p-6 md:p-8 border border-white/[0.06]">
        <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        <div className="relative">
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Overview for <span className="font-semibold text-cyan-400">{currentMonth}</span>
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/[0.06] p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Expected</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-cyan-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">Rs. {totalExpectedThisMonth.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1">{currentMonthBills.length} bills generated</p>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-emerald-500/10 p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Received</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-emerald-400">Rs. {totalReceivedThisMonth.toLocaleString()}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${paymentPercentage}%` }} />
              </div>
              <span className="text-xs text-emerald-400 font-semibold">{paymentPercentage}%</span>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border p-5 relative overflow-hidden ${remainingExpected > 0 ? 'border-orange-500/10' : 'border-emerald-500/10'}`}>
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl ${remainingExpected > 0 ? 'bg-orange-500/5' : 'bg-emerald-500/5'}`} />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Remaining</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${remainingExpected > 0 ? 'bg-orange-500/10' : 'bg-emerald-500/10'}`}>
                <Wallet className={`h-4 w-4 ${remainingExpected > 0 ? 'text-orange-400' : 'text-emerald-400'}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${remainingExpected > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
              Rs. {remainingExpected.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 mt-1">{remainingExpected > 0 ? 'Pending collection' : 'All collected!'}</p>
          </div>
        </div>
      </div>

      {/* Tenants List */}
      <div className="rounded-2xl bg-gradient-to-br from-[#0f172a] to-[#1e293b] border border-white/[0.06] overflow-hidden">
        <div className="p-5 pb-4 flex items-center justify-between border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white">Your Tenants</h2>
            <p className="text-xs text-slate-500 mt-0.5">{tenants.length} active • {currentMonth}</p>
          </div>
          <Link href="/tenants">
            <Badge className="cursor-pointer bg-white/5 text-slate-400 border border-white/[0.06] hover:bg-white/10 transition-colors text-xs px-3 py-1.5 font-medium">
              View All <ArrowRight className="w-3 h-3 ml-1.5" />
            </Badge>
          </Link>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {tenants.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-500">No tenants found. Add your first tenant to get started.</p>
            </div>
          )}
          {tenants.map(tenant => {
            const stats = getTenantMonthStats(tenant._id);
            return (
              <Link key={tenant._id} href={`/tenants/${tenant._id}`}>
                <div className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer group">
                  <div className="flex items-center gap-3.5">
                    <Avatar className="w-10 h-10 border border-white/10">
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-bold text-sm">
                        {tenant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors leading-tight">
                        {tenant.name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="bg-white/5 px-1.5 py-0.5 rounded text-[10px] font-mono">{tenant.room}</span>
                        <span>Rs. {tenant.rent.toLocaleString()}/mo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5">
                    {stats.hasBill ? (
                      <>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Paid</p>
                          <p className="text-sm font-bold text-emerald-400">Rs. {stats.paid.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Due</p>
                          <p className={`text-sm font-bold ${stats.due > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {stats.due > 0 ? `Rs. ${stats.due.toLocaleString()}` : '✓'}
                          </p>
                        </div>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-600 bg-white/[0.03] px-2 py-1 rounded-md">No bill</span>
                    )}
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
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
