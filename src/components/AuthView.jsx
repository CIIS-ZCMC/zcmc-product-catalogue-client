import React, { useState } from 'react';
import {
  Lock,
  KeyRound,
  Mail,
  User,
  BadgeCheck,
  Eye,
  EyeOff,
  ShieldCheck,
  MailCheck,
  CheckCircle2,
  XCircle,
  Building2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { api } from '../services/api';

export default function AuthView({ onAuthSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password rules validation helpers
  const hasMinLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  const isPasswordValid = hasMinLength && hasNumber && hasSpecial;

  // Matching check
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // Forgot password dialog state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: send code, 2: verify & reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotConfirmPass, setForgotConfirmPass] = useState('');
  const [forgotShowPass, setForgotShowPass] = useState(false);
  const [forgotShowConfirmPass, setForgotShowConfirmPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  const forgotHasMinLength = forgotNewPass.length >= 8;
  const forgotHasNumber = /\d/.test(forgotNewPass);
  const forgotHasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(forgotNewPass);
  const forgotPassValid = forgotHasMinLength && forgotHasNumber && forgotHasSpecial;
  const forgotPasswordsMatch = forgotConfirmPass.length > 0 && forgotNewPass === forgotConfirmPass;
  const forgotPasswordsMismatch = forgotConfirmPass.length > 0 && forgotNewPass !== forgotConfirmPass;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (tab === 'register') {
      if (!firstName.trim()) {
        setErrorMsg('Please enter your First Name.');
        return;
      }
      if (!lastName.trim()) {
        setErrorMsg('Please enter your Last Name.');
        return;
      }
      if (!email.trim()) {
        setErrorMsg('Please enter your Email Address.');
        return;
      }
      if (!isPasswordValid) {
        setErrorMsg(
          'Password must be at least 8 characters long and include at least 1 number and 1 special character (!@#$%...).'
        );
        return;
      }
      if (!confirmPassword) {
        setErrorMsg('Please confirm your password.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match. Please verify your password confirmation.');
        return;
      }

      setLoading(true);
      try {
        const res = await api.register({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          password,
          password_confirmation: confirmPassword,
        });
        onAuthSuccess(res.user, res.access_token);
      } catch (err) {
        const firstErr = err.errors ? Object.values(err.errors)[0]?.[0] : null;
        setErrorMsg(firstErr || err.message || 'Registration failed. Please check your inputs.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email.trim() || !password) {
        setErrorMsg('Please provide both email and password.');
        return;
      }

      setLoading(true);
      try {
        const res = await api.login({ email: email.trim(), password });
        onAuthSuccess(res.user, res.access_token);
      } catch (err) {
        const firstErr = err.errors ? Object.values(err.errors)[0]?.[0] : null;
        setErrorMsg(firstErr || err.message || 'Authentication failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSendResetCode = async (e) => {
    e?.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setForgotSuccess(res.message || 'Verification code sent to your email.');
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Failed to send password reset code.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e?.preventDefault();
    if (!forgotCode.trim() || forgotCode.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code received in your email.');
      return;
    }
    if (!forgotPassValid) {
      setForgotError(
        'New password must be at least 8 characters long and include at least 1 number and 1 special character.'
      );
      return;
    }
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await api.resetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        password: forgotNewPass,
        password_confirmation: forgotConfirmPass,
      });
      setForgotSuccess(res.message || 'Password reset successfully!');
      setTimeout(() => {
        setForgotOpen(false);
        setEmail(forgotEmail.trim());
        setPassword('');
        setConfirmPassword('');
        setTab('login');
        setSuccessMsg('Password reset successfully! Please sign in with your new password.');
      }, 1500);
    } catch (err) {
      const firstErr = err.errors ? Object.values(err.errors)[0]?.[0] : null;
      setForgotError(firstErr || err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Subtle Blue Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-sky-500/15 blur-3xl" />

      <div className="w-full max-w-md z-10">
        <Card className="border-slate-800/80 shadow-2xl overflow-hidden bg-white">
          {/* Brand Header Banner */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 px-6 py-6 text-white text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 shadow-inner">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <Badge className="mb-2 bg-white/15 hover:bg-white/20 text-white border-white/20 text-[10px] tracking-wider uppercase">
              Single Source of Truth (SSOT)
            </Badge>
            <h1 className="text-lg font-bold tracking-tight text-white">
              Zamboanga City Medical Center
            </h1>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Product Catalogue &amp; Procurement Registry Portal
            </p>
          </div>

          <CardHeader className="pb-3 pt-4 px-6 bg-slate-50/70 border-b border-slate-100">
            <Tabs
              value={tab}
              onValueChange={(val) => {
                setTab(val);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-6">
            {errorMsg && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {successMsg && (
              <Alert variant="success" className="mb-4">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === 'register' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="firstName"
                        required
                        placeholder="e.g. Maria"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <div className="relative">
                      <BadgeCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="lastName"
                        required
                        placeholder="e.g. Santos"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="e.g. procurement@zcmc.gov.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="pl-9"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">
                    {tab === 'register' ? 'Create Password *' : 'Password *'}
                  </Label>
                  {tab === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setForgotOpen(true);
                        setForgotEmail(email.trim());
                        setForgotStep(1);
                        setForgotError('');
                        setForgotSuccess('');
                        setForgotCode('');
                        setForgotNewPass('');
                        setForgotConfirmPass('');
                      }}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={tab === 'register' ? 'Min 8 chars, 1 number, 1 symbol' : 'Enter your password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password requirements checklist */}
                {tab === 'register' && password.length > 0 && (
                  <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Password Requirements
                    </span>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        {hasMinLength ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span className={hasMinLength ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                          At least 8 characters
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasNumber ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span className={hasNumber ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                          At least 1 number (0–9)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasSpecial ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span className={hasSpecial ? 'text-slate-900 font-medium' : 'text-slate-500'}>
                          At least 1 special character (!@#$%^&amp;*...)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              {tab === 'register' && (
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-type your password to confirm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      className={`pl-9 pr-9 ${
                        passwordsMismatch
                          ? 'border-red-400 focus-visible:border-red-500'
                          : passwordsMatch
                          ? 'border-emerald-500 focus-visible:border-emerald-600'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {passwordsMismatch && (
                    <p className="text-xs font-medium text-red-600">Passwords do not match.</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs font-medium text-emerald-600">Passwords match.</p>
                  )}
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                {tab === 'register' ? (
                  <>
                    <MailCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>A confirmation welcome email will be dispatched to your inbox.</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Encrypted authentication &amp; Sanctum token security active</span>
                  </>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full font-semibold" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {tab === 'login' ? 'Sign In to Catalogue' : 'Create Catalogue Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={(open) => !forgotLoading && setForgotOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                  {forgotStep === 1
                    ? 'Receive a 6-digit verification code via email'
                    : 'Enter your verification code and new password'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {forgotError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <AlertDescription>{forgotError}</AlertDescription>
            </Alert>
          )}

          {forgotSuccess && (
            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <AlertDescription>{forgotSuccess}</AlertDescription>
            </Alert>
          )}

          {forgotStep === 1 ? (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Enter your registered email address. We will dispatch a{' '}
                <strong className="text-slate-900">6-digit verification code</strong> via SMTP to reset your password.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="forgotEmail">Registered Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="e.g. yourname@zcmc.gov.ph"
                    className="pl-9"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotOpen(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={forgotLoading || !forgotEmail.trim()}>
                  {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Code
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-600">
                A 6-digit verification code was emailed to <strong className="text-slate-900">{forgotEmail}</strong>.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="forgotCode">6-Digit Reset Code</Label>
                <Input
                  id="forgotCode"
                  required
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="text-center font-mono text-lg font-bold tracking-[0.3em] h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgotNewPass">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgotNewPass"
                    type={forgotShowPass ? 'text' : 'password'}
                    required
                    value={forgotNewPass}
                    onChange={(e) => setForgotNewPass(e.target.value)}
                    placeholder="Min 8 chars, 1 number, 1 special char"
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setForgotShowPass((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {forgotShowPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="forgotConfirmPass">Confirm New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="forgotConfirmPass"
                    type={forgotShowConfirmPass ? 'text' : 'password'}
                    required
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    placeholder="Re-type new password"
                    className="pl-9 pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setForgotShowConfirmPass((prev) => !prev)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  >
                    {forgotShowConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {forgotPasswordsMismatch && (
                  <p className="text-xs text-red-600 font-medium">Passwords do not match.</p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={forgotLoading}
                  className="font-medium text-blue-600 hover:underline cursor-pointer"
                >
                  Resend code
                </button>
                <button
                  type="button"
                  onClick={() => setForgotStep(1)}
                  disabled={forgotLoading}
                  className="text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Change email
                </button>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setForgotOpen(false)}
                  disabled={forgotLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    forgotLoading ||
                    forgotCode.trim().length !== 6 ||
                    !forgotPassValid ||
                    !forgotPasswordsMatch
                  }
                >
                  {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
