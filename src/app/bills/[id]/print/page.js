import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Tenant from "@/models/Tenant";
import { notFound } from "next/navigation";
import PrintButton from "./PrintButton";
import { CreditCard, Hash, Calendar, MapPin, Receipt, CheckCircle2, AlertCircle, TrendingDown } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const houseOwner = "Dilan Shrestha";

export default async function PrintBillPage({ params }) {
    const { id } = await params;
    await connectDB();

    const bill = await Bill.findById(id).populate("tenantId").lean();

    if (!bill) {
        return notFound();
    }

    const { tenantId: tenant } = bill;

    return (
        <div className="min-h-screen bg-slate-50 py-12 print:bg-white print:py-0 text-slate-900 selection:bg-indigo-100" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 1.5cm; size: A4 portrait; }
                    body { background: white; -webkit-print-color-adjust: exact !important; }
                    .no-print { display: none !important; }
                    .print-shadow-none { box-shadow: none !important; }
                    .print-border-none { border: none !important; }
                }
            `}} />

            <div className="max-w-[21cm] mx-auto bg-white p-12 md:p-16 shadow-xl rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0 relative overflow-hidden">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-16">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-800 text-white w-12 h-12 flex items-center justify-center font-bold text-xl rounded-lg">
                                RM
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-800 tracking-tight uppercase">Invoice</h1>
                                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Property Statement</p>
                            </div>
                        </div>
                        <div className="pt-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">House Owner</p>
                            <p className="text-lg font-bold text-slate-800">{houseOwner}</p>
                        </div>
                    </div>

                    <div className="text-right space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statement ID</p>
                            <p className="text-xl font-bold text-slate-800 tabular-nums">#{bill._id.toString().slice(-6).toUpperCase()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Issue Date</p>
                            <p className="font-bold text-slate-600">{new Date(bill.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Participants Section */}
                <div className="grid grid-cols-2 gap-8 mb-16">
                    <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Resident Info</p>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{tenant?.name || "Premium Resident"}</h2>
                            <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span>Unit / Room {tenant?.room || "N/A"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="p-8 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Billing Period</p>
                            <h2 className="text-2xl font-bold text-slate-800 mb-3">{bill.month}</h2>
                            <div className="flex items-center">
                                {bill.remaining > 0 ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-100 text-orange-700 rounded-md font-bold text-[10px] uppercase tracking-wider border border-orange-200">
                                        <AlertCircle className="w-3 h-3" /> UNPAID
                                    </div>
                                ) : bill.remaining < 0 ? (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-md font-bold text-[10px] uppercase tracking-wider border border-blue-200">
                                        <TrendingDown className="w-3 h-3" /> ADVANCE
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md font-bold text-[10px] uppercase tracking-wider border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" /> SETTLED
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden mb-12">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="py-4 px-8 text-[10px] font-bold text-slate-500 uppercase tracking-wider w-1/2">Description</th>
                                <th className="py-4 px-8 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Details</th>
                                <th className="py-4 px-8 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                            <tr>
                                <td className="py-5 px-8">
                                    <p className="text-slate-800">Monthly Rent</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Base apartment occupancy fee</p>
                                </td>
                                <td className="py-5 px-8 text-center text-slate-400 text-sm">Regular</td>
                                <td className="py-5 px-8 text-right text-slate-800 tabular-nums">Rs. {(bill.rent || 0).toLocaleString()}</td>
                            </tr>
                            <tr>
                                <td className="py-5 px-8">
                                    <p className="text-slate-800">Electricity Charge</p>
                                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">Meter: {bill.prevUnit} → {bill.currUnit} (@ Rs. {bill.unitPrice})</p>
                                </td>
                                <td className="py-5 px-8 text-center text-slate-400 text-sm">{bill.usedUnit} Units</td>
                                <td className="py-5 px-8 text-right text-slate-800 tabular-nums">Rs. {(bill.electricityCost || 0).toLocaleString()}</td>
                            </tr>
                            {(bill.water > 0) && (
                                <tr>
                                    <td className="py-5 px-8">
                                        <p className="text-slate-800">Water & Sanitation</p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Supply & maintenance fee</p>
                                    </td>
                                    <td className="py-5 px-8 text-center text-slate-400 text-sm">—</td>
                                    <td className="py-5 px-8 text-right text-slate-800 tabular-nums">Rs. {(bill.water || 0).toLocaleString()}</td>
                                </tr>
                            )}
                            {(bill.previousDue !== 0) && (
                                <tr>
                                    <td className="py-5 px-8">
                                        <p className={cn(bill.previousDue > 0 ? "text-orange-600" : "text-blue-600")}>
                                            {bill.previousDue > 0 ? "Outstanding Balance" : "Advance Credit"}
                                        </p>
                                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">Carried forward from last statement</p>
                                    </td>
                                    <td className="py-5 px-8 text-center text-slate-400 text-sm">Forwarded</td>
                                    <td className={cn("py-5 px-8 text-right tabular-nums", bill.previousDue > 0 ? "text-orange-600" : "text-blue-600")}>
                                        {bill.previousDue > 0 ? "+" : "-"} Rs. {Math.abs(bill.previousDue).toLocaleString()}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Final Calculation */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex-1 space-y-8">
                        {bill.remarks && (
                            <div className="p-6 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Remarks</p>
                                <p className="text-sm text-slate-600 leading-relaxed font-bold">{bill.remarks}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-8 pt-8">
                            <div className="space-y-4">
                                <div className="w-24 h-px bg-slate-300" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Authority</p>
                            </div>
                            <div className="space-y-4">
                                <div className="w-24 h-px bg-slate-300" />
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resident</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-[45%] bg-slate-900 rounded-xl p-8 text-white">
                        <div className="space-y-4 mb-8 text-sm">
                            <div className="flex justify-between items-center text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                                <span>Subtotal</span>
                                <span className="text-white">Rs. {(bill.total + (bill.previousDue < 0 ? Math.abs(bill.previousDue) : -bill.previousDue)).toLocaleString()}</span>
                            </div>
                            {bill.paidAmount > 0 && (
                                <div className="space-y-2 pt-4 border-t border-slate-800">
                                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-2">Settlements</p>
                                    <div className="flex justify-between items-center font-bold">
                                        <span className="text-slate-400">Paid Amount</span>
                                        <span className="text-emerald-400">- Rs. {bill.paidAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="pt-6 border-t border-slate-800 flex justify-between items-center">
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Due Balance</p>
                            </div>
                            <div className="text-2xl font-bold tabular-nums tracking-tight">
                                Rs. {Math.abs(bill.remaining || 0).toLocaleString()}
                                {bill.remaining < 0 && <span className="text-xs ml-1 opacity-50">CR</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-16 text-center space-y-1 opacity-40 font-bold text-[8px] uppercase tracking-[0.4em]">
                    <p>Verified Property Statement • Digital Ledger</p>
                    <p>© {new Date().getFullYear()} {houseOwner}</p>
                </div>

                {/* UI Elements (Non-print) */}
                <div className="mt-16 text-center no-print border-t border-slate-100 pt-8">
                    <PrintButton />
                    <p className="text-slate-400 font-bold text-[10px] mt-4 uppercase tracking-[0.2em]">Optimize for A4 portrait orientation</p>
                </div>
            </div>
        </div>
    );
}
