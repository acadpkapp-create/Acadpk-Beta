'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

function IconPlus(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSearch(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
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

function IconDots(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="5" r="1.5" />
      <circle cx="12" cy="19" r="1.5" />
    </svg>
  );
}

function IconEye(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function initials(name) {
  if (!name) return 'ST';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

export default function StaffClient({ academyId, academyName, instituteId, instituteName, initialStaff }) {
  const activeId = academyId || instituteId;
  const activeName = academyName || instituteName || 'AcadPK Portal';

  const router = useRouter();
  const supabase = createClient();

  const [staffList, setStaffList] = useState(initialStaff || []);
  const [classesList, setClassesList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Active Dropdown state for 3 dots
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Add Staff Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    role: 'Teacher',
    phone: '',
    email: '',
    qualification: '',
    salary: '',
    status: 'Active',
    joiningDate: new Date().toISOString().slice(0, 10),
  });

  // View / Edit & Multi-Class Assignment State
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]);

  // Fetch available classes on mount
  useEffect(() => {
    async function fetchClasses() {
      const { data } = await supabase.from('classes').select('id, name, section').order('name', { ascending: true });
      if (data) setClassesList(data);
    }
    fetchClasses();
  }, []);

  // Filter staff by search and role
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      const matchesSearch =
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.qualification?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery);
      const matchesRole = roleFilter === 'all' || s.role?.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    });
  }, [staffList, searchQuery, roleFilter]);

  // Total metrics
  const totalPayroll = staffList.reduce((sum, s) => sum + (Number(s.salary) || 0), 0);
  const activeCount = staffList.filter((s) => s.status === 'Active').length;

  async function handleAddStaff(e) {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Please enter staff member name.');
      return;
    }

    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Session expired. Please log in again.');
      setSubmitting(false);
      return;
    }

    const { data: inst } = await supabase
      .from('institutes')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const payload = {
      user_id: user.id,
      academy_id: inst ? inst.id : null,
      institute_id: inst ? inst.id : null,
      full_name: formData.fullName.trim(),
      role: formData.role,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      qualification: formData.qualification.trim() || null,
      salary: Number(formData.salary) || 0,
      status: formData.status,
      salary_status: 'Unpaid',
      joining_date: formData.joiningDate,
    };

    const { data, error } = await supabase.from('staff').insert([payload]).select().single();
    setSubmitting(false);

    if (error) {
      alert(`Failed to add staff: ${error.message}`);
      return;
    }

    if (data) {
      setStaffList([data, ...staffList]);
    }

    setModalOpen(false);
    setFormData({
      fullName: '',
      role: 'Teacher',
      phone: '',
      email: '',
      qualification: '',
      salary: '',
      status: 'Active',
      joiningDate: new Date().toISOString().slice(0, 10),
    });
    router.refresh();
  }

  // Toggle Salary Paid/Unpaid Status
  async function toggleSalaryStatus(staff) {
    const newStatus = staff.salary_status === 'Paid' ? 'Unpaid' : 'Paid';
    const updated = { ...staff, salary_status: newStatus };

    setStaffList((prev) => prev.map((s) => (s.id === staff.id ? updated : s)));
    if (selectedStaff?.id === staff.id) setSelectedStaff(updated);

    await supabase.from('staff').update({ salary_status: newStatus }).eq('id', staff.id);
  }

  // Toggle individual class selection in multi-select
  function toggleClassSelection(className) {
    if (selectedClasses.includes(className)) {
      setSelectedClasses(selectedClasses.filter((c) => c !== className));
    } else {
      setSelectedClasses([...selectedClasses, className]);
    }
  }

  // Save Edit & Multi-Class Assignments
  async function handleSaveEdits(e) {
    e.preventDefault();
    if (!selectedStaff) return;

    setSubmitting(true);
    const classesString = selectedClasses.join(', ');

    const updates = {
      full_name: selectedStaff.full_name,
      role: selectedStaff.role,
      phone: selectedStaff.phone,
      email: selectedStaff.email,
      qualification: selectedStaff.qualification,
      salary: Number(selectedStaff.salary) || 0,
      status: selectedStaff.status,
      assigned_classes: classesString,
    };

    const { error } = await supabase.from('staff').update(updates).eq('id', selectedStaff.id);
    setSubmitting(false);

    if (error) {
      alert(`Failed to update staff: ${error.message}`);
      return;
    }

    setStaffList((prev) => prev.map((s) => (s.id === selectedStaff.id ? { ...s, ...updates } : s)));
    setIsEditing(false);
    alert('Staff profile & class assignments updated successfully!');
  }

  async function handleDeleteStaff(id) {
    if (!confirm('Are you sure you want to remove this staff member?')) return;

    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) {
      alert(`Error deleting: ${error.message}`);
      return;
    }

    setStaffList(staffList.filter((s) => s.id !== id));
    if (selectedStaff?.id === id) setViewModalOpen(false);
    router.refresh();
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-container-max mx-auto w-full space-y-5 bg-background min-h-screen text-slate-900">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900">Staff Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage teachers, faculty & payroll &middot; <span className="text-[#006c4d] font-semibold">{activeName}</span>
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 bg-[#004b30] hover:bg-[#003823] active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer w-full sm:w-auto"
        >
          <IconPlus width={18} height={18} />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Total Staff Members</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{staffList.length}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Active on Duty</p>
          <p className="text-xl sm:text-2xl font-bold text-[#006c4d] mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xs">
          <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase">Total Monthly Payroll</p>
          <p className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">PKR {totalPayroll.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1">
          <IconSearch width={18} height={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search staff by name, role, qualification or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'teacher', 'administrator', 'accountant'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === role
                  ? 'bg-[#004b30] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white border border-slate-200/90 rounded-3xl p-10 text-center text-slate-400">
          <p className="text-sm font-medium">No staff members found.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 text-xs font-bold text-[#006c4d] hover:underline cursor-pointer"
          >
            + Add your first staff member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => {
            const isPaid = staff.salary_status === 'Paid';

            return (
              <div
                key={staff.id}
                className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(staff.full_name)}
                      </div>
                      <div className="truncate">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">{staff.full_name}</h3>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#006c4d] text-[10px] font-bold border border-emerald-200">
                            {staff.role}
                          </span>
                          {staff.qualification && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold truncate max-w-[120px]">
                              {staff.qualification}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3-Dots Menu */}
                    <div className="relative shrink-0">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === staff.id ? null : staff.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <IconDots width={18} height={18} />
                      </button>

                      {activeMenuId === staff.id && (
                        <div className="absolute right-0 top-8 z-35 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-1 text-xs animate-fade-in">
                          {staff.phone && (
                            <a
                              href={`https://wa.me/${staff.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-emerald-50 hover:text-[#006c4d] font-semibold"
                              onClick={() => setActiveMenuId(null)}
                            >
                              <IconWhatsApp width={14} height={14} /> WhatsApp
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedStaff(staff);
                              setSelectedClasses(staff.assigned_classes ? staff.assigned_classes.split(', ').filter(Boolean) : []);
                              setIsEditing(true);
                              setViewModalOpen(true);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold"
                          >
                            Edit Profile
                          </button>
                          <button
                            onClick={() => {
                              handleDeleteStaff(staff.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center justify-between gap-2 my-3 pt-2.5 border-t border-slate-100 text-xs">
                    <span
                      onClick={() => toggleSalaryStatus(staff)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer transition-transform active:scale-95 ${
                        isPaid
                          ? 'bg-emerald-50 text-[#006c4d] border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      Salary: {isPaid ? 'Paid ✓' : 'Unpaid ⚠️'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        staff.status === 'Active'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {staff.status}
                    </span>
                  </div>

                  {/* Info list */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Phone:</span>
                      <span className="font-semibold text-slate-800">{staff.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Monthly Salary:</span>
                      <span className="font-bold text-[#006c4d]">PKR {Number(staff.salary || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Assigned Classes:</span>
                      <span className="font-bold text-slate-800 text-right max-w-[160px] truncate">
                        {staff.assigned_classes || 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* EMERALD THEME CTA BUTTON */}
                <button
                  onClick={() => {
                    setSelectedStaff(staff);
                    setSelectedClasses(staff.assigned_classes ? staff.assigned_classes.split(', ').filter(Boolean) : []);
                    setIsEditing(false);
                    setViewModalOpen(true);
                  }}
                  className="w-full py-2.5 bg-[#004b30] hover:bg-[#003823] active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <IconEye width={15} height={15} />
                  <span>View Details & Classes</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW / EDIT & MULTI-CLASS ASSIGNMENT MODAL */}
      {viewModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-5 sm:p-7 relative max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#006c4d] flex items-center justify-center font-bold text-sm">
                  {initials(selectedStaff.full_name)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedStaff.full_name}</h3>
                  <p className="text-xs text-slate-400">{selectedStaff.role} &middot; {selectedStaff.status}</p>
                </div>
              </div>
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdits} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={selectedStaff.full_name}
                    onChange={(e) => setSelectedStaff({ ...selectedStaff, full_name: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                    <select
                      value={selectedStaff.role}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, role: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d] bg-white cursor-pointer"
                    >
                      <option value="Teacher">Teacher</option>
                      <option value="Administrator">Administrator</option>
                      <option value="Accountant">Accountant</option>
                      <option value="Support Staff">Support Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                    <input
                      type="text"
                      placeholder="e.g. M.Sc Physics"
                      value={selectedStaff.qualification || ''}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, qualification: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                </div>

                {/* MULTI-CLASS ASSIGNMENT CHECKBOXES */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Assign Classes (Select multiple)</label>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2.5 space-y-1.5 bg-slate-50/50">
                    {classesList.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">No classes found in the system.</p>
                    ) : (
                      classesList.map((c) => {
                        const isSelected = selectedClasses.includes(c.name);
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                              isSelected ? 'bg-emerald-50 text-[#004b30] font-bold border border-emerald-200' : 'hover:bg-white text-slate-700'
                            }`}
                          >
                            <span>{c.name} {c.section ? `(${c.section})` : ''}</span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleClassSelection(c.name)}
                              className="rounded border-slate-300 text-[#004b30] focus:ring-[#004b30] cursor-pointer w-4 h-4"
                            />
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (PKR)</label>
                    <input
                      type="number"
                      value={selectedStaff.salary}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, salary: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={selectedStaff.phone || ''}
                      onChange={(e) => setSelectedStaff({ ...selectedStaff, phone: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-[#004b30] text-white font-semibold text-xs hover:bg-[#003823] active:scale-98 shadow-xs"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs text-slate-700">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Qualification:</span>
                    <span className="font-bold text-slate-800">{selectedStaff.qualification || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone Number:</span>
                    <span className="font-semibold">{selectedStaff.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email Address:</span>
                    <span className="font-semibold">{selectedStaff.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Monthly Salary:</span>
                    <span className="font-bold text-[#006c4d]">PKR {Number(selectedStaff.salary || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Salary Status:</span>
                    <button
                      onClick={() => toggleSalaryStatus(selectedStaff)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                        selectedStaff.salary_status === 'Paid'
                          ? 'bg-emerald-50 text-[#006c4d] border border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border border-rose-200'
                      }`}
                    >
                      {selectedStaff.salary_status === 'Paid' ? 'Paid ✓' : 'Mark as Paid'}
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">Assigned Classes:</span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-[#006c4d] rounded-lg font-bold text-right">
                      {selectedStaff.assigned_classes || 'None assigned'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100">
                  <button
                    onClick={() => handleDeleteStaff(selectedStaff.id)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs"
                  >
                    Delete Staff Member
                  </button>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#004b30] text-white font-bold text-xs hover:bg-[#003823]"
                  >
                    Edit Profile & Assign Classes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-5 sm:p-7 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Add Staff Member</h3>
                <p className="text-xs text-slate-400">Register a teacher, admin or staff profile</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Sir Ahmed Khan"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d] bg-white cursor-pointer"
                  >
                    <option value="Teacher">Teacher</option>
                    <option value="Administrator">Administrator</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Support Staff">Support Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g. M.Sc Mathematics / B.Ed"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="03001234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ahmed@acadpk.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Monthly Salary (PKR)</label>
                  <input
                    type="number"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                    placeholder="45000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm outline-none focus:border-[#006c4d]"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold text-xs hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-[#004b30] text-white font-semibold text-xs hover:bg-[#003823] active:scale-98 shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}