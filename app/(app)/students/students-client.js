'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase-client';

const emptyForm = {
  name: '',
  parent_name: '',
  parent_phone: '',
  class_or_subject: '',
  monthly_fee: '',
};

export default function StudentsClient({ academyId, academyName }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const supabase = createClient();

  async function copyParentLink(student) {
    const url = `${window.location.origin}/parent/${student.share_token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(student.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function loadStudents() {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStudents(data);
  }

  useEffect(() => {
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function startEdit(student) {
    setForm({
      name: student.name || '',
      parent_name: student.parent_name || '',
      parent_phone: student.parent_phone || '',
      class_or_subject: student.class_or_subject || '',
      monthly_fee: student.monthly_fee ?? '',
    });
    setEditingId(student.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const payload = {
      name: form.name,
      parent_name: form.parent_name || null,
      parent_phone: form.parent_phone || null,
      class_or_subject: form.class_or_subject || null,
      monthly_fee: form.monthly_fee === '' ? 0 : Number(form.monthly_fee),
    };

    let result;
    if (editingId) {
      result = await supabase.from('students').update(payload).eq('id', editingId);
    } else {
      result = await supabase.from('students').insert({ ...payload, academy_id: academyId });
    }

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    setShowForm(false);
    setForm(emptyForm);
    setEditingId(null);
    loadStudents();
  }

  async function handleDelete(id) {
    if (!confirm('Remove this student?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
      setError(error.message);
      return;
    }
    loadStudents();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">{academyName}</p>
        </div>
        <button
          onClick={startAdd}
          className="bg-brand-500 hover:bg-brand-600 active:scale-95 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all"
        >
          + Add student
        </button>
      </div>

      {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mt-6 overflow-hidden"
          >
          <h2 className="font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit student' : 'Add a student'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Student name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class / subject</label>
              <input
                type="text"
                value={form.class_or_subject}
                onChange={(e) => setForm({ ...form, class_or_subject: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly fee (PKR)</label>
              <input
                type="number"
                min="0"
                value={form.monthly_fee}
                onChange={(e) => setForm({ ...form, monthly_fee: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent name</label>
              <input
                type="text"
                value={form.parent_name}
                onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent phone</label>
              <input
                type="text"
                value={form.parent_phone}
                onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                placeholder="03xxxxxxxxx"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add student'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="text-gray-500 text-sm px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </motion.form>
        )}
      </AnimatePresence>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-gray-400">No students yet — add your first one above.</p>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm divide-y divide-gray-100">
            <AnimatePresence initial={false}>
              {students.map((s) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between px-5 py-4 overflow-hidden"
                >
                  <div>
                    <p className="font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {s.class_or_subject || 'No class set'}
                      {s.monthly_fee ? ` · PKR ${s.monthly_fee}/month` : ''}
                    </p>
                    {(s.parent_name || s.parent_phone) && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Parent: {s.parent_name || '—'} {s.parent_phone ? `· ${s.parent_phone}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => copyParentLink(s)} className="text-gray-500 font-medium">
                      {copiedId === s.id ? 'Copied!' : 'Parent link'}
                    </button>
                    <button onClick={() => startEdit(s)} className="text-brand-500 font-medium">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="text-rose-500 font-medium">
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
