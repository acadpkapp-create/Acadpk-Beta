'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

function currentMonthStr() {
  return new Date().toISOString().slice(0, 7); // "2026-10"
}

function IconArrowLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconReceipt(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconWhatsApp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function FeesClient({ academyId, academyName, instituteId, instituteName }) {
  const activeId = academyId || instituteId;
  const activeName = academyName || instituteName || 'AcadPK Portal';

  const router = useRouter();
  const [month, setMonth] = useState(currentMonthStr());
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState({}); // student_id -> fee row for selected month
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState('grid');
  const [activeClassGroup, setActiveClassGroup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClient();

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const [classRes, studentRes, feeRes] = await Promise.all([
        supabase.from('classes').select('*').order('name', { ascending: true }),
        supabase.from('students').select('*').order('full_name', { ascending: true }),
        supabase.from('fees').select('*').eq('fee_month', month),
      ]);

      if (classRes.error) throw classRes.error;
      if (studentRes.error) throw studentRes.error;
      if (feeRes.error) throw feeRes.error;

      setClasses(classRes.data || []);
      setStudents(studentRes.data || []);

      const map = {};
      (feeRes.data || []).forEach((f) => {
        map[f.student_id] = f;
      });
      setFees(map);
    } catch (err) {
      setError(err.message || 'Failed to load fee management data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [month]);

  const classGroups = useMemo(() => {
    const groups = classes.map((c) => {
      const list = students.filter((s) => s.class_name?.toLowerCase() === c.name?.toLowerCase());
      return {
        id: c.id,
        name: c.name,
        teacher: c.teacher_name,
        section: c.section,
        shift: c.shift,
        students: list,
      };
    });

    const unassigned = students.filter(
      (s) => !classes.some((c) => c.name?.toLowerCase() === s.class_name?.toLowerCase())
    );

    if (unassigned.length > 0) {
      groups.push({
        id: '__unassigned__',
        name: 'General / Unassigned',
        teacher: null,
        section: null,
        shift: null,
        students: unassigned,
      });
    }

    return groups;
  }, [classes, students]);

  // Generate batch fees for a class (Inserts 'due' status records for the selected month using academy_id)
  async function handleGenerateBatchFees(group) {
    const unbilledStudents = group.students.filter((s) => !fees[s.id]);
    if (unbilledStudents.length === 0) {
      alert(`All students in ${group.name} are already billed for ${month}!`);
      return;
    }

    setActionLoading(true);
    setError('');

    const rows = unbilledStudents.map((s) => ({
      academy_id: activeId,
      student_id: s.id,
      fee_month: month,
      amount: s.fee_amount || 5000,
      status: 'due',
    }));

    const { error: insertErr } = await supabase.from('fees').insert(rows);
    setActionLoading(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    loadData();
    router.refresh();
  }

  // Toggle individual fee status in `fees` table
  async function toggleFeeStatus(student) {
    const existingFee = fees[student.id];
    if (!existingFee) return;

    const newStatus = existingFee.status === 'paid' ? 'due' : 'paid';

    setFees((prev) => ({
      ...prev,
      [student.id]: { ...existingFee, status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null },
    }));

    await supabase
      .from('fees')
      .update({ status: newStatus, paid_at: newStatus === 'paid' ? new Date().toISOString() : null })
      .eq('id', existingFee.id);

    router.refresh();
  }

  // Mark all students in active group as Paid for this month
  async function handleMarkAllPaid(group) {
    setActionLoading(true);
    setError('');

    for (const st of group.students) {
      const existing = fees[st.id];
      if (existing) {
        await supabase
          .from('fees')
          .update({ status: 'paid', paid_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('fees').insert({
          academy_id: activeId,
          student_id: st.id,
          fee_month: month,
          amount: st.fee_amount || 5000,
          status: 'paid',
          paid_at: new Date().toISOString(),
        });
      }
    }

    setActionLoading(false);
    loadData();
    router.refresh();
  }

  // Print voucher
  function handlePrintVoucher(student) {
    const feeRow = fees[student.id];
    const amount = feeRow ? feeRow.amount : (student.fee_amount || 5000);
    const status = feeRow ? feeRow.status : 'not_billed';
    const isPaid = status === 'paid';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Voucher - ${student.full_name}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; background: #fff; }
            .voucher { border: 2px solid ${isPaid ? '#059669' : '#004b30'}; border-radius: 16px; padding: 35px; max-width: 650px; margin: auto; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 25px; }
            .header h1 { color: #004b30; margin: 0; font-size: 22px; }
            .badge { background: #e6f4ea; color: #004b30; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px; font-size: 13px; background: #f8fafc; padding: 18px; border-radius: 12px; }
            .status-box { text-align: center; font-size: 14px; font-weight: bold; padding: 12px; border-radius: 10px; margin-bottom: 25px; }
            .status-paid { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
            .status-due { background: #fee2e2; color: #b91c1c; border: 1px solid #ef4444; }
            .status-unbilled { background: #f1f5f9; color: #64748b; border: 1px solid #cbd5e1; }
            .amount-box { text-align: center; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #cbd5e1; }
            .amount-box h2 { color: #0f172a; margin: 6px 0 0; font-size: 32px; }
          </style>
        </head>
        <body>
          <div class="voucher">
            <div class="header">
              <div>
                <h1>${activeName}</h1>
                <p>Official Fee Challan & Invoice</p>
              </div>
              <div class="badge">${month}</div>
            </div>
            <div class="grid">
              <div><strong>Student:</strong> ${student.full_name}</div>
              <div><strong>Roll Number:</strong> ${student.roll_number || 'N/A'}</div>
              <div><strong>Class:</strong> ${student.class_name || 'General'}</div>
              <div><strong>Parent Phone:</strong> ${student.parent_phone || 'N/A'}</div>
            </div>
            <div class="status-box ${isPaid ? 'status-paid' : status === 'due' ? 'status-due' : 'status-unbilled'}">
              Status: ${isPaid ? 'PAID IN FULL ✓' : status === 'due' ? 'PENDING PAYMENT DUE ⚠️' : 'NOT BILLED YET'}
            </div>
            <div class="amount-box">
              <p style="margin:0; font-size:11px; color:#64748b; font-weight:bold; text-transform:uppercase;">Total Payable</p>
              <h2>PKR ${Number(amount).toLocaleString()}</h2>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  function handleSendWhatsApp(student) {
    const feeRow = fees[student.id];
    const amount = feeRow ? feeRow.amount : (student.fee_amount || 5000);
    const phone = student.parent_phone || '';
    const message = encodeURIComponent(
      `Dear Parent, fee reminder from ${activeName} for ${student.full_name} for ${month}. Total Payable: PKR ${Number(amount).toLocaleString()}. Please clear dues.`
    );
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
    } else {
      alert(`No valid phone number found for ${student.full_name}.`);
    }
  }

  const totalCollected = Object.values(fees)
    .filter((f) => f.status === 'paid')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  const totalDue = Object.values(fees)
    .filter((f) => f.status === 'due')
    .reduce((sum, f) => sum + Number(f.amount || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-container-max mx-auto w-full space-y-6 bg-background min-h-screen text-slate-900">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Fee Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Batch billing, automated WhatsApp reminders &middot; <span className="text-[#006c4d] font-semibold">{activeName}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {viewMode === 'detailing' && (
            <button
              onClick={() => {
                setViewMode('grid');
                setActiveClassGroup(null);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <IconArrowLeft width={16} height={16} />
              Back to Classes
            </button>
          )}

          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
            <label className="text-xs font-bold text-slate-600 uppercase">Month:</label>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="text-xs font-semibold outline-none bg-transparent text-slate-800 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center text-slate-400 font-medium">Loading fee records for {month}...</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Collected Revenue ({month})</p>
              <p className="text-2xl font-bold text-[#006c4d] mt-1">PKR {totalCollected.toLocaleString()}</p>
            </div>
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Pending Dues ({month})</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">PKR {totalDue.toLocaleString()}</p>
            </div>
          </div>

          {viewMode === 'grid' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {classGroups.map((group) => {
                const unbilledCount = group.students.filter((s) => !fees[s.id]).length;
                const unpaidCount = group.students.filter((s) => fees[s.id] && fees[s.id].status === 'due').length;
                const groupCollected = group.students.reduce((sum, s) => {
                  const f = fees[s.id];
                  return sum + (f && f.status === 'paid' ? Number(f.amount || 0) : 0);
                }, 0);

                return (
                  <div
                    key={group.id}
                    className="bg-white border border-slate-200/90 rounded-3xl p-7 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{group.name}</h3>
                          <p className="text-sm text-slate-500 mt-1">
                            {group.section ? `Section ${group.section}` : ''}
                            {group.section && group.shift ? ' • ' : ''}
                            {group.shift || 'General Batch'}
                          </p>
                        </div>
                        <div className={`px-3.5 py-1.5 rounded-full text-xs font-bold ${
                          unbilledCount > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : unpaidCount > 0 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-emerald-50 text-[#006c4d] border border-emerald-200'
                        }`}>
                          {unbilledCount > 0 ? `${unbilledCount} Not Billed` : unpaidCount > 0 ? `${unpaidCount} Due` : 'All Paid ✓'}
                        </div>
                      </div>

                      <div className="space-y-3.5 my-5 pt-3 border-t border-slate-100 text-sm">
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Total Enrolled:</span>
                          <span className="font-bold text-slate-800">{group.students.length} Students</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span className="text-slate-400 font-medium">Collected:</span>
                          <span className="font-bold text-[#006c4d]">PKR {groupCollected.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <button
                        onClick={() => handleGenerateBatchFees(group)}
                        disabled={actionLoading}
                        className="py-3 px-3 bg-[#004b30] hover:bg-[#003823] text-white rounded-2xl text-xs font-bold transition-all shadow-sm cursor-pointer text-center disabled:opacity-50"
                      >
                        Generate Fee
                      </button>
                      <button
                        onClick={() => {
                          setActiveClassGroup(group);
                          setViewMode('detailing');
                        }}
                        className="py-3 px-3 border border-slate-200 hover:border-[#006c4d] text-slate-700 hover:text-[#006c4d] rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        View Status
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'detailing' && activeClassGroup && (
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm w-full space-y-6">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-100 gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Fee Ledger: {activeClassGroup.name} ({month})</h2>
                  <p className="text-sm text-slate-500 mt-0.5">Generate monthly fees, dispatch WhatsApp vouchers, and manage payments</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleGenerateBatchFees(activeClassGroup)}
                    disabled={actionLoading}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Generate Batch Fee
                  </button>

                  <button
                    onClick={() => handleMarkAllPaid(activeClassGroup)}
                    disabled={actionLoading}
                    className="px-4 py-3 border border-emerald-300 text-[#006c4d] bg-emerald-50 hover:bg-emerald-100 rounded-xl font-bold text-xs transition-all cursor-pointer"
                  >
                    Mark All Paid ✓
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[65vh] overflow-y-auto pr-2">
                {activeClassGroup.students.length === 0 ? (
                  <p className="text-sm text-slate-400 py-12 text-center">No students enrolled in this class.</p>
                ) : (
                  activeClassGroup.students.map((student) => {
                    const feeRow = fees[student.id];
                    const isBilled = !!feeRow;
                    const isPaid = feeRow?.status === 'paid';

                    return (
                      <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-sm shrink-0">
                            {student.full_name ? student.full_name[0].toUpperCase() : 'ST'}
                          </div>
                          <div>
                            <p className="text-base font-bold text-slate-900">{student.full_name}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Roll #: {student.roll_number || 'N/A'} &middot; Phone: {student.parent_phone || 'N/A'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
                          <div className="text-right mr-2 hidden md:block">
                            <p className="text-xs font-bold text-slate-700">
                              PKR {Number(feeRow?.amount || student.fee_amount || 5000).toLocaleString()}
                            </p>
                            <p className="text-[10px] text-slate-400">Monthly Due</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePrintVoucher(student)}
                              title="Print Voucher"
                              className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#006c4d] hover:border-[#006c4d] hover:bg-emerald-50/50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                            >
                              <IconReceipt width={16} height={16} />
                              <span className="hidden md:inline">Voucher</span>
                            </button>

                            <button
                              onClick={() => handleSendWhatsApp(student)}
                              title="Send WhatsApp Reminder"
                              className="p-2.5 rounded-xl border border-emerald-200 text-[#006c4d] bg-emerald-50 hover:bg-emerald-100 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                            >
                              <IconWhatsApp width={16} height={16} />
                              <span className="hidden md:inline">WhatsApp</span>
                            </button>

                            {isBilled ? (
                              <button
                                onClick={() => toggleFeeStatus(student)}
                                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  isPaid
                                    ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                    : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {isPaid ? 'Paid ✓' : 'Due — Mark Paid'}
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await supabase.from('fees').insert({
                                    academy_id: activeId,
                                    student_id: student.id,
                                    fee_month: month,
                                    amount: student.fee_amount || 5000,
                                    status: 'due',
                                  });
                                  loadData();
                                  router.refresh();
                                }}
                                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                              >
                                Not Billed — Bill Now
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}