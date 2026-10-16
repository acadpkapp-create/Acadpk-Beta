'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';

const PAGE_SIZE = 10;

const emptyForm = {
  full_name: '',
  parent_name: '',
  parent_phone: '',
  address: '',
  class_name: '',
  fee_amount: '',
  fee_status: 'Paid',
};

const emptyClassForm = {
  name: '',
  teacher_name: '',
  section: '',
  shift: '',
  schedule_days: '',
  schedule_start: '',
  schedule_end: '',
  capacity: '',
};

const STATUS_STYLES = {
  Paid: 'bg-emerald-50 text-[#006c4d] border border-emerald-200',
  Pending: 'bg-rose-50 text-rose-600 border border-rose-200',
};

/* ---------------- Icons ---------------- */

function IconUsersStat(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3 2.7-5 6-5s6 2 6 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 20c.2-2.3 1.6-4 3.7-4.3" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckCircle(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3 4.7-5.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalendarFlag(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

function IconBook(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-3.5-3.5" strokeLinecap="round" />
    </svg>
  );
}

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronRight(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
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

function IconX(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function IconUserGroup(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 18v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
      <path d="M21 18v-1a4 4 0 0 0-3-3.87" strokeLinecap="round" />
    </svg>
  );
}

function IconInstructor(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" strokeLinecap="round" />
    </svg>
  );
}

function IconClock(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMoreVertical(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}

function initials(name) {
  if (!name) return 'ST';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

function monthStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

/* ---------------- Main Component ---------------- */

export default function StudentsClient({ instituteId, instituteName }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals & Drawer State
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [classModalMode, setClassModalMode] = useState('add');
  const [classEditingId, setClassEditingId] = useState(null);
  const [classForm, setClassForm] = useState(emptyClassForm);
  const [classSaving, setClassSaving] = useState(false);
  const [openClassMenuId, setOpenClassMenuId] = useState(null);

  // Transfer / Promote State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferSourceClass, setTransferSourceClass] = useState('');
  const [targetClassName, setTargetClassName] = useState('');
  const [transferring, setTransferring] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('view');
  const [drawerStudent, setDrawerStudent] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      openAdd();
      router.replace('/students', { scroll: false });
    }
  }, [searchParams]);

  async function loadData() {
    setLoading(true);
    setError('');

    const [
      { data: studentData, error: studentErr },
      { data: classData, error: classErr },
    ] = await Promise.all([
      supabase.from('students').select('*').eq('institute_id', instituteId).order('full_name', { ascending: true }),
      supabase.from('classes').select('*').eq('institute_id', instituteId).order('name', { ascending: true }),
    ]);

    setLoading(false);

    if (studentErr) {
      setError(studentErr.message);
      return;
    }

    setStudents(studentData || []);
    if (!classErr && classData) setClasses(classData);

    if (drawerStudent) {
      const updated = studentData?.find((s) => s.id === drawerStudent.id);
      if (updated) setDrawerStudent(updated);
    }
  }

  useEffect(() => {
    if (instituteId) {
      loadData();
    }
  }, [instituteId]);

  /* ---- Drawer Actions ---- */

  function openAdd(prefillClassName = '') {
    const defaultClass = prefillClassName || (classes.length > 0 ? classes[0].name : 'General');
    setForm({ ...emptyForm, class_name: defaultClass });
    setDrawerStudent(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  }

  function openView(student) {
    setDrawerStudent(student);
    setDrawerMode('view');
    setDrawerOpen(true);
  }

  function openEdit(student) {
    setForm({
      full_name: student.full_name || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      address: student.address || '',
      class_name: student.class_name || 'General',
      fee_amount: student.fee_amount ?? '',
      fee_status: student.fee_status || 'Paid',
    });
    setDrawerStudent(student);
    setDrawerMode('edit');
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => {
      setDrawerStudent(null);
      setDrawerMode('view');
    }, 200);
  }

  // Dynamic Fee Status Toggle Handler
  async function handleToggleFeeStatus(student) {
    const newStatus = student.fee_status === 'Paid' ? 'Pending' : 'Paid';
    const { error: updateErr } = await supabase
      .from('students')
      .update({ fee_status: newStatus })
      .eq('id', student.id);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setDrawerStudent({ ...student, fee_status: newStatus });
    loadData();
  }

  // Monthly Attendance Download Handler
  async function handleDownloadAttendance(student) {
    const startOfMonth = monthStart();
    const { data: attendanceData, error: attErr } = await supabase
      .from('attendance')
      .select('date, status, remarks')
      .eq('student_id', student.id)
      .gte('date', startOfMonth)
      .order('date', { ascending: true });

    if (attErr) {
      alert(`Error fetching attendance: ${attErr.message}`);
      return;
    }

    if (!attendanceData || attendanceData.length === 0) {
      alert('No attendance records found for this month yet.');
      return;
    }

    const headers = ['Date,Status,Remarks\n'];
    const rows = attendanceData.map(
      (a) => `"${a.date}","${a.status || 'Present'}","${a.remarks || ''}"`
    );

    const blob = new Blob([headers.concat(rows.join('\n')).join('')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.full_name.replace(/\s+/g, '_')}_Attendance_${new Date().toLocaleDateString('en-US', { month: 'short' })}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();

    let autoRollNumber = drawerStudent?.roll_number;
    if (drawerMode === 'add') {
      const nextNumber = students.length + 1;
      autoRollNumber = `ADM-${String(nextNumber).padStart(4, '0')}`;
    }

    const payload = {
      user_id: user?.id,
      institute_id: instituteId,
      full_name: form.full_name.trim(),
      parent_name: form.parent_name.trim() || null,
      parent_phone: form.parent_phone.trim() || null,
      address: form.address.trim() || null,
      class_name: form.class_name.trim() || 'General',
      fee_amount: form.fee_amount === '' ? 0 : Number(form.fee_amount),
      fee_status: form.fee_status || 'Paid',
      roll_number: autoRollNumber,
    };

    let result;
    if (drawerMode === 'edit' && drawerStudent) {
      result = await supabase.from('students').update(payload).eq('id', drawerStudent.id);
    } else {
      result = await supabase.from('students').insert([payload]);
    }

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    closeDrawer();
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm('Permanently remove this student record?')) return;
    const { error: delError } = await supabase.from('students').delete().eq('id', id);
    if (delError) {
      setError(delError.message);
      return;
    }
    closeDrawer();
    loadData();
  }

  function openAddClassModal() {
    setClassModalMode('add');
    setClassEditingId(null);
    setClassForm(emptyClassForm);
    setClassModalOpen(true);
  }

  function openEditClassModal(c) {
    setOpenClassMenuId(null);
    setClassModalMode('edit');
    setClassEditingId(c.id);
    setClassForm({
      name: c.name || '',
      teacher_name: c.teacher_name || '',
      section: c.section || '',
      shift: c.shift || '',
      schedule_days: c.schedule_days || '',
      schedule_start: c.schedule_start || '',
      schedule_end: c.schedule_end || '',
      capacity: c.capacity ?? '',
    });
    setClassModalOpen(true);
  }

  function openTransferModal(className) {
    setOpenClassMenuId(null);
    setTransferSourceClass(className);
    setTargetClassName('');
    setTransferModalOpen(true);
  }

  async function handleTransferSubmit(e) {
    e.preventDefault();
    if (!targetClassName.trim() || !transferSourceClass) return;
    setTransferring(true);

    const { error: updateErr } = await supabase
      .from('students')
      .update({ class_name: targetClassName.trim() })
      .eq('institute_id', instituteId)
      .eq('class_name', transferSourceClass);

    setTransferring(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    setTransferModalOpen(false);
    loadData();
  }

  async function handleDeleteClass(c) {
    setOpenClassMenuId(null);
    if (!confirm(`Delete class "${c.name}"?`)) return;
    const { error: delErr } = await supabase.from('classes').delete().eq('id', c.id);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    loadData();
  }

  async function handleClassSubmit(e) {
    e.preventDefault();
    if (!classForm.name.trim()) return;
    setClassSaving(true);

    const payload = {
      institute_id: instituteId,
      name: classForm.name.trim(),
      teacher_name: classForm.teacher_name.trim() || null,
      section: classForm.section.trim() || null,
      shift: classForm.shift || null,
      schedule_days: classForm.schedule_days.trim() || null,
      schedule_start: classForm.schedule_start || null,
      schedule_end: classForm.schedule_end || null,
      capacity: classForm.capacity ? Number(classForm.capacity) : null,
    };

    let result;
    if (classModalMode === 'edit' && classEditingId) {
      result = await supabase.from('classes').update(payload).eq('id', classEditingId);
    } else {
      result = await supabase.from('classes').insert([payload]);
    }

    setClassSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setClassModalOpen(false);
    setClassForm(emptyClassForm);
    setClassEditingId(null);
    loadData();
  }

  /* ---- Derived Metrics ---- */

  const totalStudents = students.length;
  const paidCount = students.filter((s) => s.fee_status === 'Paid').length;
  const unpaidCount = students.filter((s) => s.fee_status !== 'Paid').length;
  const newThisMonth = students.filter((s) => s.created_at >= monthStart()).length;
  const totalClasses = classes.length;

  const classGroups = useMemo(() => {
    const groups = classes.map((c) => {
      const list = students.filter((s) => s.class_name?.toLowerCase() === c.name?.toLowerCase());
      return {
        key: c.id,
        classRow: c,
        label: c.name,
        teacher: c.teacher_name,
        section: c.section,
        shift: c.shift,
        schedule: c.schedule_days,
        capacity: c.capacity,
        students: list,
      };
    });

    const unassigned = students.filter(
      (s) => !classes.some((c) => c.name?.toLowerCase() === s.class_name?.toLowerCase())
    );

    if (unassigned.length > 0) {
      groups.push({
        key: '__unassigned__',
        classRow: null,
        label: 'General / Unassigned',
        teacher: null,
        section: null,
        shift: null,
        schedule: null,
        capacity: null,
        students: unassigned,
      });
    }

    return groups;
  }, [classes, students]);

  const isSearching = search.trim().length > 0;
  const mode = isSearching ? 'search' : statusFilter ? 'status' : selectedClass ? 'class' : 'grid';

  const currentList = useMemo(() => {
    let list = students;
    if (mode === 'class') {
      const group = classGroups.find((g) => g.key === selectedClass);
      list = group ? group.students : list;
    }
    if (mode === 'status') {
      list = list.filter((s) => (statusFilter === 'Paid' ? s.fee_status === 'Paid' : s.fee_status !== 'Paid'));
    }
    if (mode === 'search') {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.full_name?.toLowerCase().includes(q) ||
          s.parent_name?.toLowerCase().includes(q) ||
          s.parent_phone?.toLowerCase().includes(q) ||
          s.class_name?.toLowerCase().includes(q) ||
          s.roll_number?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) =>
      sortDir === 'asc' ? a.full_name.localeCompare(b.full_name) : b.full_name.localeCompare(a.full_name)
    );
  }, [students, mode, selectedClass, statusFilter, search, sortDir, classGroups]);

  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = currentList.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, selectedClass, statusFilter, sortDir]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-container-max mx-auto w-full space-y-6 bg-background min-h-screen text-on-surface">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Students</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage enrollments, statuses, and profiles &middot; <span className="text-[#006c4d] font-semibold">{instituteName}</span>
          </p>
        </div>
        <button
          onClick={() => openAdd()}
          className="inline-flex items-center justify-center gap-2 bg-[#004b30] hover:bg-[#003823] active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm transition-all cursor-pointer shadow-sm"
        >
          <IconPlus width={18} height={18} />
          Add New Student
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Bento Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => {
            setStatusFilter(null);
            setSelectedClass(null);
            setSearch('');
          }}
          className={`text-left bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
            mode === 'grid' ? 'border-[#006c4d] ring-2 ring-[#006c4d]/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006c4d] flex items-center justify-center">
              <IconUsersStat width={20} height={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalStudents}</p>
          <p className="text-xs mt-1.5 text-emerald-600 font-medium">
            {newThisMonth > 0 ? `+${newThisMonth} new this month` : 'All students loaded'}
          </p>
        </button>

        <button
          onClick={() => {
            setSelectedClass(null);
            setSearch('');
            setStatusFilter((f) => (f === 'Paid' ? null : 'Paid'));
          }}
          className={`text-left bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
            statusFilter === 'Paid' ? 'border-[#006c4d] ring-2 ring-[#006c4d]/20' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fees Paid</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#006c4d] flex items-center justify-center">
              <IconCheckCircle width={20} height={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{paidCount}</p>
          <p className="text-xs mt-1.5 text-slate-400">Clear accounts</p>
        </button>

        <button
          onClick={() => {
            setSelectedClass(null);
            setSearch('');
            setStatusFilter((f) => (f === 'Pending' ? null : 'Pending'));
          }}
          className={`text-left bg-white border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
            statusFilter === 'Pending' ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider">Unpaid / Defaulters</p>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <IconCalendarFlag width={20} height={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-rose-600">{unpaidCount}</p>
          <p className="text-xs mt-1.5 text-rose-500 font-medium">Requires follow-up</p>
        </button>

        <button
          onClick={() => {
            setStatusFilter(null);
            setSelectedClass(null);
            setSearch('');
          }}
          className="text-left bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Classes</p>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <IconBook width={20} height={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900">{totalClasses}</p>
          <p className="text-xs mt-1.5 text-slate-400">Active grade batches</p>
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="relative max-w-md">
        <IconSearch width={16} height={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students by name, roll #, phone, or class..."
          className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm bg-white outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
        />
      </div>

      {/* Grid View: Classes Overview */}
      {mode === 'grid' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {classGroups.map((g) => {
            const c = g.classRow;
            const isFull = c?.capacity && g.students.length >= c.capacity;

            return (
              <div
                key={g.key}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 tracking-tight">{g.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {g.section ? `Section ${g.section}` : ''}
                        {g.section && g.shift ? ' • ' : ''}
                        {g.shift || ''}
                        {!g.section && !g.shift ? 'General Batch' : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {c && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenClassMenuId(openClassMenuId === c.id ? null : c.id);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                          >
                            <IconMoreVertical width={16} height={16} />
                          </button>

                          {openClassMenuId === c.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1"
                            >
                              <button
                                onClick={() => openEditClassModal(c)}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              >
                                Edit Class
                              </button>
                              <button
                                onClick={() => openTransferModal(c.name)}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                              >
                                Transfer / Promote Students
                              </button>
                              <button
                                onClick={() => handleDeleteClass(c)}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              >
                                Delete Class
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3.5 my-4 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <IconUserGroup width={16} height={16} />
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Students</p>
                        <p className="font-semibold text-slate-800">
                          {g.students.length} Enrolled{' '}
                          {isFull && <span className="text-rose-500 font-normal">(Capacity Reached)</span>}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <IconInstructor width={16} height={16} />
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Class Teacher</p>
                        <p className="font-semibold text-slate-800">{g.teacher || 'Not Assigned'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <IconClock width={16} height={16} />
                      </div>
                      <div>
                        <p className="text-slate-400 text-[10px] uppercase font-semibold">Schedule</p>
                        <p className="font-semibold text-slate-800">{g.schedule || 'Flexible Schedule'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setSelectedClass(g.key)}
                    className="w-full py-2.5 border border-slate-200 hover:border-[#006c4d] rounded-2xl text-xs font-bold text-slate-700 hover:text-[#006c4d] hover:bg-emerald-50/20 transition-all cursor-pointer shadow-2xs"
                  >
                    View
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={openAddClassModal}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-slate-400 hover:border-[#006c4d] hover:text-[#006c4d] hover:bg-emerald-50/10 transition-all cursor-pointer min-h-[220px] group"
          >
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:scale-110 transition-transform">
              <IconPlus width={20} height={20} />
            </div>
            <span className="text-sm font-bold">Add New Class</span>
          </button>
        </div>
      )}

      {/* List View / Class Roll */}
      {mode !== 'grid' && (
        <div className="fixed inset-0 sm:inset-auto sm:relative z-30 bg-background sm:bg-white sm:border sm:border-slate-200/80 sm:rounded-2xl sm:shadow-xs overflow-y-auto sm:overflow-hidden p-4 sm:p-0 min-h-screen sm:min-h-0">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSelectedClass(null);
                  setStatusFilter(null);
                  setSearch('');
                }}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <IconArrowLeft width={18} height={18} />
              </button>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {mode === 'search' ? 'Search Results' : statusFilter ? `${statusFilter} Students` : 'Class Directory'}
              </h2>
            </div>
            <button
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Sort: {sortDir === 'asc' ? 'A–Z' : 'Z–A'}
            </button>
          </div>

          {loading ? (
            <p className="text-xs text-slate-400 p-8 text-center">Loading students...</p>
          ) : currentList.length === 0 ? (
            <p className="text-xs text-slate-400 p-8 text-center">No students found.</p>
          ) : (
            <div className="divide-y divide-slate-100 pb-20 sm:pb-0">
              {paginated.map((s) => (
                <div
                  key={s.id}
                  onClick={() => openView(s)}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-xs shrink-0">
                      {initials(s.full_name)}
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-800 truncate">{s.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">
                        {s.roll_number ? `${s.roll_number} · ` : ''}Class: {s.class_name || 'General'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 font-medium hidden sm:block">
                      Rs. {s.fee_amount || 0}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${STATUS_STYLES[s.fee_status || 'Paid']}`}>
                      {s.fee_status || 'Paid'}
                    </span>
                    <IconChevronRight width={16} height={16} className="text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transfer / Promote Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Transfer / Promote Class</h3>
                <p className="text-xs text-slate-400">Move all students from "{transferSourceClass}" to another batch</p>
              </div>
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconX width={20} height={20} />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Class / Batch Name *
                </label>
                <select
                  required
                  value={targetClassName}
                  onChange={(e) => setTargetClassName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all bg-white"
                >
                  <option value="">Select Target Class...</option>
                  {classes
                    .filter((c) => c.name !== transferSourceClass)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name} {c.section ? `(${c.section})` : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={transferring}
                  className="px-6 py-2.5 rounded-xl bg-[#004b30] text-white font-semibold text-xs hover:bg-[#003823] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  {transferring ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Drawer Popup */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <h3 className="font-bold text-lg text-slate-900">
                  {drawerMode === 'add' ? 'Add Student' : drawerMode === 'edit' ? 'Edit Details' : 'Student Profile'}
                </h3>
                <button onClick={closeDrawer} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <IconX width={20} height={20} />
                </button>
              </div>

              {drawerMode === 'view' && drawerStudent && (
                <div className="space-y-5">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-2xs">
                      {initials(drawerStudent.full_name)}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{drawerStudent.full_name}</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Roll #: {drawerStudent.roll_number || 'N/A'}</p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 text-xs border border-slate-100">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Class:</span>
                      <span className="font-semibold text-slate-800">{drawerStudent.class_name || 'General'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Parent Name:</span>
                      <span className="font-semibold text-slate-800">{drawerStudent.parent_name || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Parent Phone:</span>
                      <span className="font-semibold text-slate-800">{drawerStudent.parent_phone || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Address:</span>
                      <span className="font-semibold text-slate-800">{drawerStudent.address || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Monthly Fee:</span>
                      <span className="font-semibold text-[#006c4d]">Rs. {drawerStudent.fee_amount || 0}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                      <span className="text-slate-400 font-medium">Fee Status:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[drawerStudent.fee_status || 'Paid']}`}>
                        {drawerStudent.fee_status || 'Paid'}
                      </span>
                    </div>
                  </div>

                  {/* Monthly Attendance Meter & Report Actions */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">Attendance This Month</span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        {new Date().toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <path
                            className="text-slate-100"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="text-[#006c4d]"
                            strokeDasharray={`${drawerStudent.attendance_percentage || 85}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <div className="absolute text-xs font-bold text-slate-800">
                          {drawerStudent.attendance_percentage || 85}%
                        </div>
                      </div>

                      <div className="flex-1 space-y-2">
                        <button
                          onClick={() => router.push(`/attendance?studentId=${drawerStudent.id}`)}
                          className="w-full py-1.5 px-3 rounded-xl border border-slate-200 text-slate-700 font-semibold text-[11px] hover:bg-slate-50 transition-colors cursor-pointer text-center block"
                        >
                          View Attendance Sheet
                        </button>
                        <button
                          onClick={() => handleDownloadAttendance(drawerStudent)}
                          className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 text-[#006c4d] border border-emerald-200/80 font-semibold text-[11px] hover:bg-emerald-100 transition-colors cursor-pointer text-center block"
                        >
                          Download Report (CSV)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Fee Status Toggle Button */}
                  <button
                    onClick={() => handleToggleFeeStatus(drawerStudent)}
                    className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer shadow-2xs ${
                      drawerStudent.fee_status === 'Paid'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                        : 'bg-emerald-50 text-[#006c4d] border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {drawerStudent.fee_status === 'Paid' ? 'Mark Fee as Pending' : 'Mark Fee as Paid'}
                  </button>

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => openEdit(drawerStudent)}
                      className="flex-1 bg-[#004b30] text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-[#003823] cursor-pointer shadow-sm transition-colors"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => handleDelete(drawerStudent.id)}
                      className="px-4 py-2.5 text-rose-600 border border-rose-200 rounded-xl font-semibold text-xs hover:bg-rose-50 cursor-pointer transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

              {(drawerMode === 'add' || drawerMode === 'edit') && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Student Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>

                  {/* Dynamic Class Selection Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Class / Batch</label>
                    <select
                      value={form.class_name}
                      onChange={(e) => setForm({ ...form, class_name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] bg-white cursor-pointer"
                    >
                      <option value="General">General / Unassigned</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.section ? `(${c.section})` : ''} {c.shift ? `• ${c.shift}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Parent Name</label>
                      <input
                        type="text"
                        value={form.parent_name}
                        onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                      <input
                        type="text"
                        value={form.parent_phone}
                        onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Amount (Rs.)</label>
                      <input
                        type="number"
                        value={form.fee_amount}
                        onChange={(e) => setForm({ ...form, fee_amount: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Status</label>
                      <select
                        value={form.fee_status}
                        onChange={(e) => setForm({ ...form, fee_status: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] bg-white cursor-pointer"
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 bg-[#004b30] text-white py-2.5 rounded-xl font-semibold text-xs hover:bg-[#003823] cursor-pointer"
                    >
                      {saving ? 'Saving...' : drawerMode === 'edit' ? 'Save Changes' : 'Save Student'}
                    </button>
                    <button
                      type="button"
                      onClick={closeDrawer}
                      className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Flexible Add/Edit Class Modal */}
      {classModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {classModalMode === 'edit' ? 'Edit Class / Batch' : 'Add New Class / Batch'}
                </h3>
                <p className="text-xs text-slate-400">Configure class details and optional academy timings</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setClassModalOpen(false);
                  setClassForm(emptyClassForm);
                  setClassEditingId(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <IconX width={20} height={20} />
              </button>
            </div>

            <form onSubmit={handleClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class / Batch Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Class 10-A or Physics Evening Batch"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Section <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Shift <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <select
                    value={classForm.shift}
                    onChange={(e) => setClassForm({ ...classForm, shift: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all bg-white"
                  >
                    <option value="">None / Regular</option>
                    <option value="Morning Shift">Morning Shift</option>
                    <option value="Afternoon Shift">Afternoon Shift</option>
                    <option value="Evening Shift">Evening Shift</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Teacher / Instructor <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sir Ahmed or Ma'am Aisha"
                  value={classForm.teacher_name}
                  onChange={(e) => setClassForm({ ...classForm, teacher_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Schedule Days <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mon - Fri or Sat, Sun"
                  value={classForm.schedule_days}
                  onChange={(e) => setClassForm({ ...classForm, schedule_days: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="time"
                    value={classForm.schedule_start}
                    onChange={(e) => setClassForm({ ...classForm, schedule_start: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Time <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="time"
                    value={classForm.schedule_end}
                    onChange={(e) => setClassForm({ ...classForm, schedule_end: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Max Student Capacity <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 40"
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-[#006c4d] focus:ring-2 focus:ring-[#006c4d]/20 transition-all"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setClassModalOpen(false);
                    setClassForm(emptyClassForm);
                    setClassEditingId(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={classSaving}
                  className="px-6 py-2.5 rounded-xl bg-[#004b30] text-white font-semibold text-xs hover:bg-[#003823] active:scale-[0.98] transition-all shadow-sm cursor-pointer"
                >
                  {classSaving ? 'Saving...' : classModalMode === 'edit' ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}