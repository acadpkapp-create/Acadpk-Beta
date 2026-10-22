'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-client';

export default function MarkAttendancePage() {
  const supabase = createClient();

  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Authenticated State
  const [teacher, setTeacher] = useState(null);
  const [instituteName, setInstituteName] = useState('');
  const [assignedClasses, setAssignedClasses] = useState([]);
  
  // Selection & Attendance State
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: 'Present' | 'Absent' | 'Late' }
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 1. Authenticate Teacher via PIN
  async function handleLogin(e) {
    e.preventDefault();
    if (!pin || pin.length !== 4) {
      setErrorMsg('Please enter a valid 4-digit PIN.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Query staff table by PIN
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

    setTeacher(staffData);
    
    // Fetch Institute Name to prevent any cross-institute confusion
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
    }

    // Parse assigned classes (stored as comma-separated string)
    if (staffData.assigned_classes) {
      const classesArray = staffData.assigned_classes.split(',').map(c => c.trim()).filter(Boolean);
      setAssignedClasses(classesArray);
    }

    setLoading(false);
  }

  // 2. Fetch Students and Class ID when a Class is Selected
  async function handleSelectClass(className) {
    setSelectedClass(className);
    setSuccessMessage('');
    setLoading(true);

    const targetInstituteId = teacher.institute_id || teacher.academy_id;

    // Fetch class ID from classes table
    const { data: classRecord } = await supabase
      .from('classes')
      .select('id')
      .ilike('name', className.trim())
      .maybeSingle();

    if (classRecord) {
      setSelectedClassId(classRecord.id);
    } else {
      setSelectedClassId(null);
    }

    // Fetch students belonging to this class and institute
    let query = supabase
      .from('students')
      .select('id, full_name, class_name, roll_number')
      .ilike('class_name', className.trim());

    if (targetInstituteId) {
      query = query.eq('institute_id', targetInstituteId);
    }

    const { data: studentData, error } = await query.order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching students:', error.message);
    } else if (studentData) {
      setStudents(studentData);
      
      // Default all students to 'Present'
      const initialAttendance = {};
      studentData.forEach(s => {
        initialAttendance[s.id] = 'Present';
      });
      setAttendance(initialAttendance);
    }
    setLoading(false);
  }

  // 3. Submit Attendance Logs
  async function handleSubmitAttendance() {
    if (!selectedClass || students.length === 0) return;

    setSubmitting(true);
    const today = new Date().toISOString().slice(0, 10);
    const activeInstId = teacher.institute_id || teacher.academy_id;

    const payload = students.map(student => ({
      institute_id: activeInstId,
      student_id: student.id,
      class_name: selectedClass,
      class_id: selectedClassId,
      teacher_id: teacher.id,
      status: attendance[student.id] || 'Present',
      date: today,
    }));

    // Upsert matching the main dashboard's conflict rule
    const { error } = await supabase
      .from('attendance')
      .upsert(payload, { onConflict: 'student_id,date' });

    setSubmitting(false);
    if (error) {
      alert('Failed to save attendance: ' + error.message);
    } else {
      setSuccessMessage('Attendance marked successfully!');
    }
  }

  // --- RENDER VIEW 1: PIN ACCESS SCREEN (MATCHING LOGIN IMAGE STYLING) ---
  if (!teacher) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 text-slate-800">
        <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-[32px] p-8 shadow-sm space-y-6">
          
          {/* AcadPK Logo Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#004b30] flex items-center justify-center text-white font-black text-lg shadow-2xs">
                A
              </div>
              <span className="text-2xl font-black tracking-tight text-[#00281c]">
                Acad<span className="text-[#004b30]">PK</span>
              </span>
            </div>
            
            <div className="pt-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Teacher Access Portal</h1>
              <p className="text-xs text-slate-400 mt-0.5">Enter your 4-digit PIN code to continue</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                4-Digit Security PIN
              </label>
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
              className="w-full py-3.5 bg-[#004b30] hover:bg-[#003823] active:scale-[0.98] text-white rounded-2xl font-bold text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                'Verifying PIN...'
              ) : (
                <>
                  Access Portal
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Authorized Staff Only &middot; <span className="font-semibold text-slate-500">AcadPK System</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER VIEW 2: ATTENDANCE DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-6 max-w-xl mx-auto space-y-4">
      
      {/* INSTITUTE BRANDING HEADER */}
      <div className="bg-[#004b30] text-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 bg-emerald-900/50 px-2 py-0.5 rounded">
            Active Institute
          </span>
          <h2 className="text-lg font-bold mt-0.5">{instituteName || 'AcadPK Institute'}</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold">{teacher.full_name}</p>
          <button
            onClick={() => { setTeacher(null); setPin(''); setSelectedClass(''); }}
            className="text-[10px] text-emerald-200 underline hover:text-white cursor-pointer mt-0.5"
          >
            Switch User
          </button>
        </div>
      </div>

      {/* STEP 1: SELECT ASSIGNED CLASS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Select Class to Mark Attendance</h3>
        
        {assignedClasses.length === 0 ? (
          <p className="text-xs text-rose-500 font-medium py-2">
            No classes have been assigned to your profile yet. Please ask the owner to assign classes in Staff Management.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {assignedClasses.map((cls) => (
              <button
                key={cls}
                onClick={() => handleSelectClass(cls)}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  selectedClass === cls
                    ? 'bg-[#004b30] text-white border-[#004b30] shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* STEP 2: STUDENT ROSTER & STATUS TOGGLE */}
      {selectedClass && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Roster: {selectedClass}</h3>
              <p className="text-[11px] text-slate-400">{students.length} students enrolled</p>
            </div>
            <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-lg text-slate-600 font-bold">
              {new Date().toLocaleDateString()}
            </span>
          </div>

          {loading ? (
            <p className="text-center py-8 text-xs text-slate-400">Loading student roster...</p>
          ) : students.length === 0 ? (
            <p className="text-center py-8 text-xs text-slate-400">No students found in {selectedClass}.</p>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              {students.map((student, index) => {
                const status = attendance[student.id] || 'Present';

                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 w-5 text-right">{index + 1}</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">{student.full_name}</p>
                        {student.roll_number && <p className="text-[10px] text-slate-400">Roll #: {student.roll_number}</p>}
                      </div>
                    </div>

                    {/* Status Toggles */}
                    <div className="flex items-center gap-1">
                      {['Present', 'Absent', 'Late'].map((st) => {
                        const active = status === st;
                        let btnStyle = 'bg-slate-100 text-slate-600';
                        if (active) {
                          if (st === 'Present') btnStyle = 'bg-emerald-600 text-white shadow-xs';
                          if (st === 'Absent') btnStyle = 'bg-rose-600 text-white shadow-xs';
                          if (st === 'Late') btnStyle = 'bg-amber-500 text-white shadow-xs';
                        }

                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: st }))}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${btnStyle}`}
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
          )}

          {successMessage && (
            <p className="text-xs text-emerald-600 font-bold text-center bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
              {successMessage}
            </p>
          )}

          {students.length > 0 && (
            <button
              onClick={handleSubmitAttendance}
              disabled={submitting}
              className="w-full py-3.5 bg-[#004b30] hover:bg-[#003823] active:scale-98 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all mt-2"
            >
              {submitting ? 'Saving Attendance...' : `Submit Attendance for ${selectedClass}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}