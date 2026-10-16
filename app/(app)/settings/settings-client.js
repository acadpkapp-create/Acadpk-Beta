'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';

function IconTrash(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconShield(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconBuilding(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SettingsClient({ userEmail, role, academyId, academyName: initialAcademyName, instituteType }) {
  const router = useRouter();
  const supabase = createClient();

  const [academyName, setAcademyName] = useState(initialAcademyName);
  const [savingAcademy, setSavingAcademy] = useState(false);
  const [academySaved, setAcademySaved] = useState(false);
  const [academyError, setAcademyError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  async function saveAcademyName(e) {
    e.preventDefault();
    setSavingAcademy(true);
    setAcademyError('');
    setAcademySaved(false);

    // Update the 'institutes' table directly
    const { error } = await supabase.from('institutes').update({ name: academyName }).eq('id', academyId);
    setSavingAcademy(false);

    if (error) {
      setAcademyError(error.message);
      return;
    }
    setAcademySaved(true);
    setTimeout(() => {
      setAcademySaved(false);
      router.refresh();
    }, 1500);
  }

  async function changePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 2500);
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || 'Something went wrong.');
      }
      await supabase.auth.signOut();
      router.push('/login');
    } catch (err) {
      setDeleting(false);
      setDeleteError(err.message);
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6 bg-background min-h-screen text-slate-900">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Portal Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Manage your account credentials, institute details, and data preferences.
        </p>
      </div>

      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006c4d] flex items-center justify-center">
            <IconShield width={20} height={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Account Credentials</h2>
            <p className="text-xs text-slate-500">Your active login profile and role assignment</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Email Address</p>
            <p className="text-sm font-semibold text-slate-800 mt-1">{userEmail}</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase">Institute Type</p>
            <p className="text-sm font-semibold text-[#006c4d] mt-1">{instituteType}</p>
          </div>
        </div>
      </div>

      <form onSubmit={saveAcademyName} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#006c4d] flex items-center justify-center">
            <IconBuilding width={20} height={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Institute Profile</h2>
            <p className="text-xs text-slate-500">Update your academy or coaching center name</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Institute Name</label>
          <input
            type="text"
            required
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#006c4d] bg-white shadow-2xs"
          />
        </div>

        {academyError && <p className="text-xs font-semibold text-rose-600">{academyError}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingAcademy}
            className="px-6 py-3 bg-[#004b30] hover:bg-[#003823] text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            {savingAcademy ? 'Saving…' : academySaved ? 'Saved Successfully!' : 'Save Institute Name'}
          </button>
        </div>
      </form>

      <form onSubmit={changePassword} className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
          <p className="text-xs text-slate-500 mt-0.5">Ensure your account is secure by using a strong password</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#006c4d] bg-white shadow-2xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-[#006c4d] bg-white shadow-2xs"
            />
          </div>
        </div>

        {passwordError && <p className="text-xs font-semibold text-rose-600">{passwordError}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingPassword}
            className="px-6 py-3 bg-[#004b30] hover:bg-[#003823] text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-all shadow-sm cursor-pointer"
          >
            {savingPassword ? 'Updating…' : passwordSaved ? 'Password Updated!' : 'Update Password'}
          </button>
        </div>
      </form>

      <div id="danger" className="bg-white border border-rose-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-rose-600">Danger Zone</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            This permanently deletes your entire institute, all student records, fee logs, and attendance history. This action is irreversible.
          </p>
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          className="inline-flex items-center gap-2 border border-rose-300 text-rose-600 hover:bg-rose-50 font-bold px-5 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
        >
          <IconTrash width={16} height={16} />
          Delete Account / Institute
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Are you absolutely sure?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Type <span className="font-mono font-bold text-rose-600">DELETE</span> below to confirm your decision.
              </p>
            </div>

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-rose-500 bg-white"
              placeholder="Type DELETE here"
            />

            {deleteError && <p className="text-xs font-semibold text-rose-600">{deleteError}</p>}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText('');
                  setDeleteError('');
                }}
                className="flex-1 px-5 py-3 rounded-xl text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs disabled:opacity-40 transition-all shadow-sm cursor-pointer"
              >
                {deleting ? 'Deleting…' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}