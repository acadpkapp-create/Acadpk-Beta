'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

function IconBook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconArrowLeft(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDownload(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 3v12m0 0 4-4m-4 4-4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUserFile(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="16" y1="17" x2="8" y2="17" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function initials(name) {
  if (!name) return 'ST';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export default function AttendanceClient({ instituteId, instituteName }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active view: 'grid' | 'marking' | 'viewing'
  const [viewMode, setViewMode] = useState('grid');
  const [activeClass, setActiveClass] = useState(null);

  // Marking session state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [dailyStatuses, setDailyStatuses] = useState({});
  const [savingAttendance, setSavingAttendance] = useState(false);

  // Viewing & Historical Inspection State
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10));
  const [historicalStatuses, setHistoricalStatuses] = useState({});
  const [updatingHistorical, setUpdatingHistorical] = useState(false);

  async function loadData() {
    setLoading(true);
    setError('');

    const [
      { data: classData, error: classErr },
      { data: studentData, error: studentErr },
      { data: attData, error: attErr },
    ] = await Promise.all([
      supabase.from('classes').select('*').eq('institute_id', instituteId).order('name', { ascending: true }),
      supabase.from('students').select('*').eq('institute_id', instituteId).order('full_name', { ascending: true }),
      supabase.from('attendance').select('*').eq('institute_id', instituteId),
    ]);

    setLoading(false);

    if (classErr || studentErr || attErr) {
      setError(classErr?.message || studentErr?.message || attErr?.message);
      return;
    }

    setClasses(classData || []);
    setStudents(studentData || []);
    setAttendanceRecords(attData || []);
  }

  useEffect(() => {
    if (instituteId) loadData();
  }, [instituteId]);

  // Sync historical statuses when activeClass, viewDate, or attendanceRecords change
  useEffect(() => {
    if (activeClass && viewMode === 'viewing') {
      const statusMap = {};
      activeClass.students.forEach((s) => {
        const record = attendanceRecords.find(
          (a) => a.student_id === s.id && a.date === viewDate
        );
        statusMap[s.id] = record ? record.status : 'Not Marked';
      });
      setHistoricalStatuses(statusMap);
    }
  }, [activeClass, viewDate, attendanceRecords, viewMode]);

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

  function startMarking(group) {
    setActiveClass(group);
    const initialMap = {};
    group.students.forEach((s) => {
      initialMap[s.id] = 'Present';
    });
    setDailyStatuses(initialMap);
    setViewMode('marking');
  }

  function startViewing(group) {
    setActiveClass(group);
    setViewDate(new Date().toISOString().slice(0, 10));
    setViewMode('viewing');
  }

  async function handleSaveAttendance(e) {
    e.preventDefault();
    setSavingAttendance(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const payload = activeClass.students.map((s) => ({
      user_id: user?.id,
      institute_id: instituteId,
      student_id: s.id,
      class_name: activeClass.name,
      date: selectedDate,
      status: dailyStatuses[s.id] || 'Present',
    }));

    const { error: upsertErr } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,date' });

    setSavingAttendance(false);

    if (upsertErr) {
      setError(upsertErr.message);
      return;
    }

    alert('Attendance saved successfully!');
    setViewMode('grid');
    loadData();
  }

  // Update or Insert Historical Log for a specific student on viewDate
  async function handleUpdateHistoricalStatus(studentId, newStatus) {
    setUpdatingHistorical(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      user_id: user?.id,
      institute_id: instituteId,
      student_id: studentId,
      class_name: activeClass.name,
      date: viewDate,
      status: newStatus,
    };

    const { error: upsertErr } = await supabase
      .from('attendance')
      .upsert([payload], { onConflict: 'student_id,date' });

    setUpdatingHistorical(false);

    if (upsertErr) {
      setError(upsertErr.message);
      return;
    }

    setHistoricalStatuses((prev) => ({ ...prev, [studentId]: newStatus }));
    loadData();
  }

  // Calculate monthly stats for a student
  function getStudentMonthlyStats(studentId) {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const studentAtt = attendanceRecords.filter(
      (a) => a.student_id === studentId && a.date?.startsWith(currentMonthPrefix)
    );

    const present = studentAtt.filter((a) => a.status === 'Present').length;
    const late = studentAtt.filter((a) => a.status === 'Late').length;
    const absent = studentAtt.filter((a) => a.status === 'Absent').length;
    const total = studentAtt.length;
    
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    return { percentage, present, late, absent, total, records: studentAtt };
  }

  function getClassAttendanceRate(group) {
    if (!group || group.students.length === 0) return 100;
    const studentIds = new Set(group.students.map((s) => s.id));
    const classAtt = attendanceRecords.filter((a) => studentIds.has(a.student_id));
    if (classAtt.length === 0) return 95;

    const presentCount = classAtt.filter((a) => a.status === 'Present' || a.status === 'Late').length;
    return Math.round((presentCount / classAtt.length) * 100);
  }

  // Individual Student Monthly Attendance Report PDF
  function handleExportSingleStudentPDF(student, group) {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const stats = getStudentMonthlyStats(student.id);

    let logsHTML = '';
    if (stats.records.length === 0) {
      logsHTML = `<tr><td colspan="3" style="text-align: center; padding: 15px; color: #94a3b8;">No attendance records entered for this month.</td></tr>`;
    } else {
      stats.records.forEach((r) => {
        let statusColor = '#059669';
        if (r.status === 'Absent') statusColor = '#dc2626';
        if (r.status === 'Late') statusColor = '#d97706';

        logsHTML += `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9;">${r.date}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; font-weight: bold; color: ${statusColor};">${r.status}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #f1f5f9; color: #64748b;">${r.remarks || '—'}</td>
          </tr>
        `;
      });
    }

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${student.full_name} - Attendance Card (${monthName})</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; padding: 35px; background: #fff; }
            .card { border: 2px solid #004b30; border-radius: 12px; padding: 25px; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { color: #004b30; margin: 0; font-size: 22px; }
            .header p { color: #64748b; margin: 4px 0 0; font-size: 13px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 25px; text-align: center; }
            .stat-box { background: #f1f5f9; padding: 12px; border-radius: 8px; }
            .stat-box p { margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
            .stat-box h3 { margin: 4px 0 0; font-size: 18px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 10px; }
            th { background: #004b30; color: #fff; text-align: left; padding: 8px 12px; font-weight: 600; }
            .footer { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 12px; color: #64748b; }
            .signature { border-top: 1px solid #cbd5e1; width: 180px; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <h1>${instituteName}</h1>
              <p>Monthly Student Attendance Report &middot; ${monthName}</p>
            </div>

            <div class="info-grid">
              <div><strong>Student Name:</strong> ${student.full_name}</div>
              <div><strong>Roll Number:</strong> ${student.roll_number || 'N/A'}</div>
              <div><strong>Class / Batch:</strong> ${group.name} ${group.section ? `(${group.section})` : ''}</div>
              <div><strong>Parent Name:</strong> ${student.parent_name || 'N/A'}</div>
            </div>

            <div class="stats-grid">
              <div class="stat-box">
                <p>Present</p>
                <h3 style="color: #059669;">${stats.present} Days</h3>
              </div>
              <div class="stat-box">
                <p>Late</p>
                <h3 style="color: #d97706;">${stats.late} Days</h3>
              </div>
              <div class="stat-box">
                <p>Absent</p>
                <h3 style="color: #dc2626;">${stats.absent} Days</h3>
              </div>
              <div class="stat-box" style="background: #e6f4ea;">
                <p>Attendance Rate</p>
                <h3 style="color: #004b30;">${stats.percentage}%</h3>
              </div>
            </div>

            <h4 style="margin: 0 0 10px; color: #334155;">Daily Attendance Log (${monthName})</h4>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${logsHTML}
              </tbody>
            </table>

            <div class="footer">
              <p>Generated via AcadPK Portal on ${new Date().toLocaleDateString()}</p>
              <div class="signature">
                Principal / Admin Stamp
              </div>
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Generate Whole Class Professional PDF Report
  function handleExportPDF(group) {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    let rowsHTML = '';
    group.students.forEach((s, index) => {
      const stats = getStudentMonthlyStats(s.id);
      rowsHTML += `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${index + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: 600;">${s.full_name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${s.roll_number || 'N/A'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #059669; font-weight: 600;">${stats.present}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #dc2626; font-weight: 600;">${stats.absent}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; font-weight: bold;">${stats.percentage}%</td>
        </tr>
      `;
    });

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${group.name} - Attendance Report (${monthName})</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1e293b; padding: 30px; }
            .header { text-align: center; border-bottom: 2px solid #004b30; padding-bottom: 15px; margin-bottom: 25px; }
            .header h1 { color: #004b30; margin: 0; font-size: 24px; }
            .header p { color: #64748b; margin: 5px 0 0; font-size: 14px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
            th { background-color: #f8fafc; color: #475569; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; }
            .footer { margin-top: 40px; text-align: right; font-size: 12px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${instituteName}</h1>
            <p>Monthly Class Attendance Summary Report</p>
          </div>
          <div class="meta">
            <span>Class / Batch: ${group.name} ${group.section ? `(${group.section})` : ''}</span>
            <span>Billing Period: ${monthName}</span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center;">#</th>
                <th>Student Name</th>
                <th style="text-align: center;">Roll Number</th>
                <th style="text-align: center;">Present Days</th>
                <th style="text-align: center;">Absent Days</th>
                <th style="text-align: center;">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
          <div class="footer">
            <p>Generated automatically via AcadPK Portal</p>
          </div>
          <script>
            window.onload = function() { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-container-max mx-auto w-full space-y-6 bg-background min-h-screen text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Attendance Manager</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track daily sheets and export attendance reports &middot; <span className="text-[#006c4d] font-semibold">{instituteName}</span>
          </p>
        </div>

        {viewMode !== 'grid' && (
          <button
            onClick={() => setViewMode('grid')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer self-start shadow-xs"
          >
            <IconArrowLeft width={18} height={18} />
            Back to Classes
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* VIEW 1: CLASS CARDS GRID */}
      {viewMode === 'grid' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classGroups.map((group) => {
            const attendanceRate = getClassAttendanceRate(group);

            return (
              <div
                key={group.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{group.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {group.section ? `Section ${group.section}` : ''}
                        {group.section && group.shift ? ' • ' : ''}
                        {group.shift || 'General Batch'}
                      </p>
                    </div>

                    <div className="px-3 py-1 rounded-full bg-emerald-50 text-[#006c4d] border border-emerald-200 text-xs font-bold">
                      {attendanceRate}% Avg
                    </div>
                  </div>

                  <div className="space-y-3 my-4 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Total Enrolled:</span>
                      <span className="font-semibold text-slate-800">{group.students.length} Students</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-400 font-medium">Instructor:</span>
                      <span className="font-semibold text-slate-800">{group.teacher || 'Not Assigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <button
                    onClick={() => startMarking(group)}
                    className="py-2.5 px-3 bg-[#004b30] hover:bg-[#003823] text-white rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer text-center"
                  >
                    Mark Attendance
                  </button>
                  <button
                    onClick={() => startViewing(group)}
                    className="py-2.5 px-3 border border-slate-200 hover:border-[#006c4d] text-slate-700 hover:text-[#006c4d] rounded-2xl text-xs font-bold transition-all cursor-pointer text-center"
                  >
                    View & Reports
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: MARK ATTENDANCE SHEET */}
      {viewMode === 'marking' && activeClass && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Mark Attendance: {activeClass.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Select status for each enrolled student</p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-[#006c4d] bg-white shadow-2xs"
              />
            </div>
          </div>

          {activeClass.students.length === 0 ? (
            <p className="text-sm text-slate-400 py-16 text-center">No students enrolled in this class yet.</p>
          ) : (
            <form onSubmit={handleSaveAttendance} className="space-y-4">
              <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-2">
                {activeClass.students.map((student) => {
                  const currentStatus = dailyStatuses[student.id] || 'Present';

                  return (
                    <div key={student.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-sm shadow-2xs">
                          {initials(student.full_name)}
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900">{student.full_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">Roll #: {student.roll_number || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {['Present', 'Absent', 'Late'].map((st) => {
                          const active = currentStatus === st;
                          let style = 'bg-slate-100 text-slate-600 border-transparent';
                          if (active) {
                            if (st === 'Present') style = 'bg-emerald-600 text-white shadow-sm';
                            if (st === 'Absent') style = 'bg-rose-600 text-white shadow-sm';
                            if (st === 'Late') style = 'bg-amber-500 text-white shadow-sm';
                          }

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => setDailyStatuses({ ...dailyStatuses, [student.id]: st })}
                              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${style}`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className="px-6 py-3 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAttendance}
                  className="px-8 py-3 rounded-xl bg-[#004b30] text-white font-bold text-xs hover:bg-[#003823] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  {savingAttendance ? 'Saving...' : 'Save Attendance Sheet'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* VIEW 3: VIEW, HISTORICAL INSPECT/EDIT, INDIVIDUAL PDF & CLASS PDF EXPORT */}
      {viewMode === 'viewing' && activeClass && (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm w-full space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Attendance Preview & Reports: {activeClass.name}</h2>
              <p className="text-sm text-slate-500 mt-0.5">Inspect past dates, modify logs, and export individual or class PDF reports</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-600 uppercase">Inspect Date:</label>
                <input
                  type="date"
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                  className="text-xs font-semibold outline-none bg-transparent text-slate-800 cursor-pointer"
                />
              </div>

              <button
                onClick={() => handleExportPDF(activeClass)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#004b30] text-white rounded-xl font-bold text-xs hover:bg-[#003823] transition-all shadow-sm cursor-pointer"
              >
                <IconDownload width={16} height={16} />
                Export Class PDF
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto pr-2">
            {activeClass.students.length === 0 ? (
              <p className="text-sm text-slate-400 py-12 text-center">No students found in this class.</p>
            ) : (
              activeClass.students.map((student) => {
                const stats = getStudentMonthlyStats(student.id);
                const currentDayStatus = historicalStatuses[student.id] || 'Not Marked';

                return (
                  <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(student.full_name)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900">{student.full_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Roll #: {student.roll_number || 'N/A'} &middot; Month: <span className="text-emerald-600 font-semibold">{stats.present}P</span> / <span className="text-rose-600 font-semibold">{stats.absent}A</span> ({stats.percentage}%)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      {/* Individual Student Report Download Button */}
                      <button
                        onClick={() => handleExportSingleStudentPDF(student, activeClass)}
                        title="Download Student Monthly Report PDF"
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-[#006c4d] hover:border-[#006c4d] hover:bg-emerald-50/50 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                      >
                        <IconUserFile width={16} height={16} />
                        <span className="hidden md:inline">Report PDF</span>
                      </button>

                      {/* Historical Status Toggles for Selected Date */}
                      <div className="flex items-center gap-1.5">
                        {['Present', 'Absent', 'Late'].map((st) => {
                          const active = currentDayStatus === st;
                          let style = 'bg-slate-100 text-slate-600 border-transparent';
                          if (active) {
                            if (st === 'Present') style = 'bg-emerald-600 text-white shadow-xs';
                            if (st === 'Absent') style = 'bg-rose-600 text-white shadow-xs';
                            if (st === 'Late') style = 'bg-amber-500 text-white shadow-xs';
                          }

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateHistoricalStatus(student.id, st)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${style}`}
                            >
                              {st}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}