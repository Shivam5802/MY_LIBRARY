import React, { useEffect, useState } from 'react';
import { developerService } from '../services/developer.service';
import type { User } from '../types/auth';
import { ThemeToggle } from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import {
  UserCircle,
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User as UserIcon,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';
import { ImageUpload } from '../components/ImageUpload';

export const DeveloperProfilePage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [, setProfile] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [username, setUsername] = useState('');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const res = await developerService.getProfile();
      setProfile(res);
      setName(res.name || '');
      setEmail(res.email || '');
      setMobile(res.mobile || '');
      setUsername(res.username || '');
      setProfilePhotoUrl(res.profilePhotoUrl || '');
    } catch (err: any) {
      console.error('Failed to load developer profile:', err);
      setProfileError(err.message || 'Failed to fetch profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdatingProfile(true);
      setProfileError(null);
      setProfileSuccess(null);

      const updated = await developerService.updateProfile({
        name: name.trim() || null,
        email: email.trim() || null,
        mobile: mobile.trim() || null,
        username: username.trim(),
        profilePhotoUrl: profilePhotoUrl.trim() || null,
      });

      setProfile(updated);
      setProfileSuccess('Profile details successfully updated.');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);

      await developerService.changePassword(currentPassword, newPassword, confirmNewPassword);

      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <UserCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Developer Account &amp; Security
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage developer credentials, account appearance, and administrative security credentials.
        </p>
      </div>

      {/* Appearance & Theme Setting */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs dark:shadow-none space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Appearance &amp; Theme Mode
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Independent theme selection for the Developer Technical Console.
            </p>
          </div>
          <ThemeToggle showLabel={true} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Sun className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold">Light Mode</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Crisp white &amp; navy palette</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Moon className="w-5 h-5 text-purple-500 dark:text-purple-400 shrink-0" />
            <div>
              <p className="text-xs font-bold">Dark Mode</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Deep charcoal &amp; slate palette</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
              theme === 'system'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <Laptop className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-xs font-bold">System Preference</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Syncs with OS settings</p>
            </div>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-none space-y-5 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Profile Details</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Personal administrative contact information</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {profileError}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Developer Name"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dev@mylibrary.in"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Mobile</label>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="9876543210"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <ImageUpload
                label="Avatar / Profile Photo"
                value={profilePhotoUrl}
                onChange={(photo) => setProfilePhotoUrl(photo || '')}
                disabled={isUpdatingProfile}
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold cursor-pointer disabled:opacity-50 transition-all shadow-xs"
              >
                {isUpdatingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Profile Changes
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs dark:shadow-none space-y-5 transition-colors">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Security &amp; Password</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update developer authentication secret</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Role Protection Note:
              </div>
              <p>Roles cannot be modified here. Developer role remains securely locked to technical console.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold cursor-pointer disabled:opacity-50 transition-all shadow-xs border border-slate-200 dark:border-slate-700"
              >
                {isChangingPassword && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Change Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
