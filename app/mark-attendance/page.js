'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export default function MarkAttendancePage() {
  const supabase = createClient();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Authenticated Staff State
  const [staffUser, setStaffUser] = useState(null);
  const [instituteName, setInstituteName] = useState('');
  
  // Attendance States
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Authenticate Staff via PIN
  async function handleLogin(e) {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      setErrorMsg('Please enter a valid 4-digit PIN.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const { data: staffData, error } = await supabase
      .from('staff')
      .select('*')
      .eq('pin_code', pin)
      .maybeSingle();

    if (error || !staffData) {
      setLoading(false);
      setErrorMsg('Invalid PIN code. Please check with your administrator.');
      return;
    }

    setStaffUser(staffData);
    
    const activeInstId = staffData.institute_id || staffData.academy_id;
    if (activeInstId) {
      const { data: instData } = await supabase
        .from('institutes')
        .select('name')
        .eq('id', activeInstId)
        .maybeSingle();

      if (instData) {
        setInstituteName(instData.name);
      }

      if (staffData.assigned_classes) {
        setAssignedClasses(staffData.assigned_classes.split(',').map(c => c.trim()).filter(Boolean));
      }
    }

    setLoading(false);
  }

  // 2. Select Class & Fetch Students
  async function handleSelectClass(className) {
    setSelectedClass(className);
    setSuccessMessage('');
    setLoading(true);

    const targetInstituteId = staffUser.institute_id || staffUser.academy_id;

    const { data: classRecord } = await supabase
      .from('classes')
      .select('id')
      .ilike('name', className.trim())
      .maybeSingle();

    if (classRecord) setSelectedClassId(classRecord.id);

    let query = supabase
      .from('students')
      .select('id, full_name, class_name, roll_number')
      .ilike('class_name', className.trim());

    if (targetInstituteId) query = query.eq('institute_id', targetInstituteId);

    const { data: studentData } = await query.order('full_name', { ascending: true });

    if (studentData) {
      setStudents(studentData);
      const initialAttendance = {};
      studentData.forEach(s => { initialAttendance[s.id] = 'Present'; });
      setAttendance(initialAttendance);
    }
    setLoading(false);
  }

  // 3. Submit Attendance
  async function handleSubmitAttendance() {
    if (!selectedClass || students.length === 0) return;
    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const activeInstId = staffUser.institute_id || staffUser.academy_id;

    const payload = students.map(student => ({
      institute_id: activeInstId,
      student_id: student.id,
      class_name: selectedClass,
      class_id: selectedClassId,
      teacher_id: staffUser.id,
      status: attendance[student.id] || 'Present',
      date: today,
    }));

    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'student_id,date' });
    setSubmitting(false);
    if (error) alert('Failed to save attendance: ' + error.message);
    else setSuccessMessage('Attendance marked successfully!');
  }

  // --- VIEW 1: PIN ACCESS LOGIN SCREEN ---
  if (!staffUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-slate-800">
        <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2.5">
              <span className="text-2xl font-black tracking-tight text-[#00281c]">
                Acad<span className="text-[#004b30]">PK</span>
              </span>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Staff Attendance Portal</h1>
              <p className="text-xs text-slate-400 mt-0.5">Enter your 4-digit PIN code to continue</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">4-Digit Security PIN</label>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-center tracking-[0.8em] text-2xl py-3.5 rounded-2xl bg-[#ebf3fe] border border-transparent text-slate-800 font-mono outline-none focus:border-[#004b30] focus:bg-white transition-all shadow-2xs"
                autoFocus
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-semibold text-center bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#004b30] hover:bg-[#003823] text-white rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying PIN...' : 'Access Portal'}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">Authorized Staff Only &middot; <span className="font-semibold text-slate-500">AcadPK System</span></p>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW 2: ATTENDANCE WORKSPACE ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6 max-w-2xl mx-auto space-y-5">
      
      {/* HEADER BAR */}
      <div className="bg-[#004b30] text-white p-4 sm:p-5 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-900/50 px-2.5 py-1 rounded">
            Staff Attendance Portal
          </span>
          <h2 className="text-lg sm:text-xl font-bold mt-1">{instituteName || 'AcadPK Institute'}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">{staffUser.full_name}</p>
          <button
            onClick={() => { setStaffUser(null); setPin(''); setSelectedClass(''); }}
            className="text-[11px] text-emerald-200 underline hover:text-white cursor-pointer mt-0.5"
          >
            Switch User / Logout
          </button>
        </div>
      </div>

      {/* SELECT CLASS SECTION */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Select Assigned Class</h3>
        {assignedClasses.length === 0 ? (
          <p className="text-xs text-rose-500 font-medium py-2">No classes assigned to your profile. Contact your institute owner.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assignedClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => handleSelectClass(cls)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedClass === cls ? 'bg-[#004b30] text-white border-[#004b30]' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STUDENT ROSTER & ATTENDANCE MARKING */}
      {selectedClass && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-slate-800 text-sm">Roster: {selectedClass} ({students.length} students)</h3>
            <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-bold">{new Date().toLocaleDateString()}</span>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {students.map((student, index) => {
              const status = attendance[student.id] || 'Present';
              return (
                <div key={student.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400 w-5 text-right">{index + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{student.full_name}</p>
                      {student.roll_number && <p className="text-[10px] text-slate-400">Roll #: {student.roll_number}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {['Present', 'Absent', 'Late'].map((st) => {
                      const active = status === st;
                      let btnStyle = 'bg-slate-100 text-slate-600';
                      if (active) {
                        if (st === 'Present') btnStyle = 'bg-emerald-600 text-white';
                        if (st === 'Absent') btnStyle = 'bg-rose-600 text-white';
                        if (st === 'Late') btnStyle = 'bg-amber-500 text-white';
                      }
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: st }))}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${btnStyle}`}
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

          {successMessage && (
            <p className="text-xs text-emerald-600 font-bold text-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              {successMessage}
            </p>
          )}

          {students.length > 0 && (
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting}
              className="w-full py-3.5 bg-[#004b30] hover:bg-[#003823] text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              {submitting ? 'Saving Attendance...' : `Submit Attendance for ${selectedClass}`}
            </button>
          )}
        </div>
      )}

    </div>
  );
}