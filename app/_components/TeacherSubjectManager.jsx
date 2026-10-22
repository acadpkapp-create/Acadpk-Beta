'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client'; // Adjust your supabase client path if needed

export default function TeacherSubjectManager({ instituteId }) {
  const supabase = createClient();

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Form States
  const [teacherName, setTeacherName] = useState('');
  const [teacherPhone, setTeacherPhone] = useState('');
  const [teacherPin, setTeacherPin] = useState('');
  
  const [subjectName, setSubjectName] = useState('');

  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch initial data on load
  useEffect(() => {
    if (instituteId) {
      fetchData();
    }
  }, [instituteId]);

  async function fetchData() {
    try {
      // Fetch Teachers
      const { data: tData } = await supabase
        .from('teachers')
        .select('*')
        .eq('institute_id', instituteId);
      if (tData) setTeachers(tData);

      // Fetch Subjects
      const { data: sData } = await supabase
        .from('subjects')
        .select('*')
        .eq('institute_id', instituteId);
      if (sData) setSubjects(sData);

      // Fetch Existing Classes (from your existing table)
      const { data: cData } = await supabase
        .from('classes')
        .select('*')
        .eq('institute_id', instituteId);
      if (cData) setClasses(cData);

      // Fetch Assignments with Relations
      const { data: aData } = await supabase
        .from('teacher_assignments')
        .select(`
          id,
          teachers (name, pin_code),
          classes (name),
          subjects (name)
        `)
        .eq('institute_id', instituteId);
      if (aData) setAssignments(aData);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }

  // 1. Add Teacher Handler
  async function handleAddTeacher(e) {
    e.preventDefault();
    if (!teacherName || !teacherPin) return alert('Please enter name and PIN code');
    setLoading(true);

    const { error } = await supabase.from('teachers').insert([
      {
        institute_id: instituteId,
        name: teacherName,
        phone: teacherPhone,
        pin_code: teacherPin,
      },
    ]);

    setLoading(false);
    if (error) {
      alert('Error adding teacher: ' + error.message);
    } else {
      setTeacherName('');
      setTeacherPhone('');
      setTeacherPin('');
      fetchData();
      setMessage('Teacher added successfully!');
    }
  }

  // 2. Add Subject Handler
  async function handleAddSubject(e) {
    e.preventDefault();
    if (!subjectName) return alert('Please enter a subject name');
    setLoading(true);

    const { error } = await supabase.from('subjects').insert([
      {
        institute_id: instituteId,
        name: subjectName,
      },
    ]);

    setLoading(false);
    if (error) {
      alert('Error adding subject: ' + error.message);
    } else {
      setSubjectName('');
      fetchData();
      setMessage('Subject added successfully!');
    }
  }

  // 3. Assign Teacher Handler
  async function handleAssign(e) {
    e.preventDefault();
    if (!selectedTeacher || !selectedClass || !selectedSubject) {
      return alert('Please select a teacher, class, and subject.');
    }
    setLoading(true);

    const { error } = await supabase.from('teacher_assignments').insert([
      {
        institute_id: instituteId,
        teacher_id: selectedTeacher,
        class_id: selectedClass,
        subject_id: selectedSubject,
      },
    ]);

    setLoading(false);
    if (error) {
      alert('Error making assignment (might already exist): ' + error.message);
    } else {
      setSelectedTeacher('');
      setSelectedClass('');
      setSelectedSubject('');
      fetchData();
      setMessage('Teacher assigned to class & subject successfully!');
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 bg-white rounded-xl shadow-sm border border-gray-100">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Teacher & Subject Management</h2>
        <p className="text-sm text-gray-500">Configure teacher PINs and map them to specific classes and subjects.</p>
        {message && <p className="mt-2 text-sm text-green-600 font-medium">{message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Box 1: Add Teacher */}
        <form onSubmit={handleAddTeacher} className="p-4 border rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700">1. Add Teacher & PIN</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600">Teacher Name</label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Sir Ali"
              className="w-full mt-1 p-2 border rounded text-sm bg-white"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Phone Number</label>
            <input
              type="text"
              value={teacherPhone}
              onChange={(e) => setTeacherPhone(e.target.value)}
              placeholder="03001234567"
              className="w-full mt-1 p-2 border rounded text-sm bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">4-Digit PIN Code</label>
            <input
              type="text"
              maxLength={4}
              value={teacherPin}
              onChange={(e) => setTeacherPin(e.target.value)}
              placeholder="e.g. 4821"
              className="w-full mt-1 p-2 border rounded text-sm bg-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded text-sm font-medium hover:bg-blue-700 transition"
          >
            Save Teacher
          </button>
        </form>

        {/* Box 2: Add Subject */}
        <form onSubmit={handleAddSubject} className="p-4 border rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700">2. Add Subject</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600">Subject Name</label>
            <input
              type="text"
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full mt-1 p-2 border rounded text-sm bg-white"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-2 rounded text-sm font-medium hover:bg-blue-700 transition mt-10"
          >
            Save Subject
          </button>
        </form>

        {/* Box 3: Assign Teacher to Class & Subject */}
        <form onSubmit={handleAssign} className="p-4 border rounded-lg space-y-4 bg-gray-50">
          <h3 className="font-semibold text-gray-700">3. Map Teacher to Class</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600">Select Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full mt-1 p-2 border rounded text-sm bg-white"
              required
            >
              <option value="">-- Choose Teacher --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (PIN: {t.pin_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full mt-1 p-2 border rounded text-sm bg-white"
              required
            >
              <option value="">-- Choose Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full mt-1 p-2 border rounded text-sm bg-white"
              required
            >
              <option value="">-- Choose Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white p-2 rounded text-sm font-medium hover:bg-green-700 transition"
          >
            Assign Teacher
          </button>
        </form>
      </div>

      {/* Current Active Mappings List */}
      <div className="mt-6 border-t pt-4">
        <h3 className="font-semibold text-gray-700 mb-3">Active Teacher Assignments</h3>
        {assignments.length === 0 ? (
          <p className="text-sm text-gray-400">No teacher assignments configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-2">Teacher</th>
                  <th className="p-2">PIN</th>
                  <th className="p-2">Class</th>
                  <th className="p-2">Subject</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2 font-medium text-gray-800">{item.teachers?.name}</td>
                    <td className="p-2 font-mono text-blue-600">{item.teachers?.pin_code}</td>
                    <td className="p-2">{item.classes?.name}</td>
                    <td className="p-2">{item.subjects?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}