import React, { useEffect, useState } from 'react';
import { ProfileService } from '../services/dashboard.service';
import { BillingService } from '../services/billing.service';
import type { User } from '../types/auth';
import { ImageUpload } from '../components/ImageUpload';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { UserCircle, Key, Lock, CheckCircle2, Loader2, Sun, Moon, Laptop } from 'lucide-react';

export const OwnerProfilePage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await ProfileService.getProfile();
        setProfile(data);
        setName(data.name || '');
        setUsername(data.username || '');
        setEmail(data.email || '');
        setMobile(data.mobile || '');
        setProfilePhotoUrl(data.profilePhotoUrl || null);
      } catch (err: any) {
        setProfileError(err.message || 'Failed to load profile.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(false);
    setProfileError(null);
    setSavingProfile(true);

    try {
      const updated = await ProfileService.updateProfile({
        name: name.trim() || null,
        username: username.trim(),
        email: email.trim() || null,
        mobile: mobile.trim() || null,
        profilePhotoUrl,
      });
      setProfile(updated);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);
    setPasswordError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      await ProfileService.changePassword({
        currentPassword,
        newPassword,
        confirmNewPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading owner credentials...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <UserCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          Owner Profile &amp; Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, contact information, appearance, and security credentials.
        </p>
      </div>

      {/* Appearance & Theme Setting */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Appearance &amp; Theme Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose how MY LIBRARY looks for your session. Follows device preference or switch manually.
            </p>
          </div>
          <ThemeToggle showLabel={true} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold">Light Mode</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Crisp white &amp; navy palette</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Moon className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-sm font-bold">Dark Mode</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Deep charcoal &amp; slate palette</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Laptop className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-bold">System Preference</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Syncs with OS settings</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Details Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-6 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Personal Information
          </h3>

          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Profile updated successfully.
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <ImageUpload
              label="Owner Profile Avatar"
              value={profilePhotoUrl}
              onChange={setProfilePhotoUrl}
              disabled={savingProfile}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={savingProfile}
                placeholder="Library Owner Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={savingProfile}
                required
                placeholder="username"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={savingProfile}
                placeholder="owner@mylibrary.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                disabled={savingProfile}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving Changes...
                  </>
                ) : (
                  'Save Profile Details'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-6 transition-colors">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Security &amp; Password
          </h3>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Password changed successfully!
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Current Password *
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={savingPassword}
                required
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                New Password *
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={savingPassword}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                disabled={savingPassword}
                required
                minLength={6}
                placeholder="Re-enter new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingPassword}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                  </>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" /> Change Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* WhatsApp Message Template Settings */}
      <ReminderTemplateSettingsSection />
    </div>
  );
};

const ReminderTemplateSettingsSection: React.FC = () => {
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const defaultTemplate =
    'Hello {name}, your monthly library fee of ₹{amount} for MY LIBRARY is due on {dueDate} for Seat #{seat}. Please make the payment to avoid interruption. Thank you!';

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const t = await BillingService.getReminderTemplate();
        setTemplate(t);
      } catch (e: any) {
        setTemplate(defaultTemplate);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);
    try {
      await BillingService.updateReminderTemplate(template);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update reminder template.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTemplate(defaultTemplate);
  };

  if (loading) return null;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-xl space-y-4 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Fee Reminder WhatsApp Message Template
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Personalize the default notification sent to students when fees are due or overdue.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold cursor-pointer underline"
        >
          Reset to Default
        </button>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Template saved successfully!
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <textarea
            rows={3}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            disabled={saving}
            required
            className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs leading-relaxed focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
          <p className="font-semibold text-slate-700 dark:text-slate-300">Available Variables:</p>
          <div className="flex flex-wrap gap-2 text-indigo-600 dark:text-indigo-300 font-mono">
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{'{name}'}</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{'{amount}'}</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{'{dueDate}'}</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{'{seat}'}</span>
            <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">{'{libraryName}'}</span>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </form>
    </div>
  );
};
