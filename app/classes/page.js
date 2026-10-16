'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

export default function ClassesPage() {
  const [instituteType, setInstituteType] = useState('School / College');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', section: '', teacher: '' });

  // Get dynamic terms based on institute profile
  const getTerms = () => {
    switch (instituteType) {
      case 'Quran Academy / Hifz':
        return { title: 'Halqas', item: 'Halqa', sub: 'Manage your Quran learning groups and assigned Qaris.' };
      case 'IELTS / Test Prep':
      case 'Tuition / Coaching':
        return { title: 'Batches', item: 'Batch', sub: 'Manage active student batches and subject schedules.' };
      case 'School / College':
      default:
        return { title: 'Classes & Sections', item: 'Class / Section', sub: 'Manage academic grades, sections, and class teachers.' };
    }
  };

  const terms = getTerms();

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch current institute type
        const { data: institute } = await supabase
          .from('institutes')
          .select('type')
          .limit(1)
          .single();

        if (institute?.type) {
          setInstituteType(institute.type);
        }
      }
      setLoading(false);
    }

    loadData();
  }, []);

  const handleAddClass = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    // Local state addition (replace with Supabase insert as database tables connect)
    const newEntry = {
      id: Date.now(),
      name: formData.name,
      section: formData.section || 'A',
      teacher: formData.teacher || 'Unassigned',
      studentsCount: 0,
    };

    setClasses([...classes, newEntry]);
    setFormData({ name: '', section: '', teacher: '' });
    setShowModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{terms.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{terms.sub}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#005c45] hover:bg-[#004d3d] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New {terms.item}</span>
        </button>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total {terms.title}</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">{classes.length}</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Students</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {classes.reduce((sum, c) => sum + c.studentsCount, 0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Staff</span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {new Set(classes.map((c) => c.teacher).filter((t) => t !== 'Unassigned')).size}
          </div>
        </div>
      </div>

      {/* Content Table / Empty State */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {classes.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No {terms.title.toLowerCase()} created yet</h3>
            <p className="text-xs text-slate-500 mb-4">Click below to set up your first {terms.item.toLowerCase()}.</p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-[#005c45] text-white text-xs font-medium px-3.5 py-2 rounded-lg hover:bg-[#004d3d] transition-colors"
            >
              + Create {terms.item}
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">{terms.item} Name</th>
                <th className="p-4">Section / Room</th>
                <th className="p-4">Assigned Staff</th>
                <th className="p-4">Students enrolled</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {classes.map((cls) => (
                <tr key={cls.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-slate-900">{cls.name}</td>
                  <td className="p-4 text-slate-600">{cls.section}</td>
                  <td className="p-4 text-slate-600">{cls.teacher}</td>
                  <td className="p-4 text-slate-600">{cls.studentsCount} students</td>
                  <td className="p-4 text-right">
                    <button className="text-xs text-[#005c45] hover:underline font-medium">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-lg">Add New {terms.item}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddClass} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {terms.item} Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={instituteType === 'School / College' ? 'e.g. Class 5' : 'e.g. Physics Evening'}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005c45]/20 focus:border-[#005c45]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Section / Details</label>
                <input
                  type="text"
                  placeholder="e.g. Section A or Morning Batch"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005c45]/20 focus:border-[#005c45]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Teacher / Instructor</label>
                <input
                  type="text"
                  placeholder="e.g. Sir Ahmed"
                  value={formData.teacher}
                  onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#005c45]/20 focus:border-[#005c45]"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium bg-[#005c45] hover:bg-[#004d3d] text-white rounded-lg transition-colors"
                >
                  Save {terms.item}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}