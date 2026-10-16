import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LockResetIcon from '@mui/icons-material/LockReset';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import PasswordIcon from '@mui/icons-material/Password';
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
      // Sign In
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
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.25) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.2) 0px, transparent 50%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Brand Banner */}
        <Box
          sx={{
            p: 3,
            backgroundColor: '#2563eb',
            color: '#ffffff',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <Box
            // sx={{
            //   display: 'inline-flex',
            //   p: 1.2,
            //   borderRadius: '50%',
            //   backgroundColor: 'rgba(255, 255, 255, 0.15)',
            //   mb: 1.2,
            // }}
          >
            {/* <LocalHospitalIcon sx={{ fontSize: 32, color: '#ffffff' }} /> */}
          </Box>
          {/* <Typography variant="overline" sx={{ display: 'block', letterSpacing: '0.12em', fontWeight: 800, opacity: 0.9 }}>
            Republic of the Philippines &bull; Department of Health
          </Typography> */}
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            Zamboanga City Medical Center
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.85, fontWeight: 600, display: 'block', mt: 0.5 }}>
            Product Catalogue Portal
          </Typography>
        </Box>

        {/* Tab Switcher: Sign In vs Register */}
        <Box sx={{ borderBottom: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' }}>
          <Tabs
            value={tab}
            onChange={(e, val) => {
              setTab(val);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Sign In" value="login" sx={{ fontWeight: 700, py: 1.5 }} />
            <Tab label="Create Account" value="register" sx={{ fontWeight: 700, py: 1.5 }} />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3.5 }}>
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setErrorMsg('')}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 2.5 }} onClose={() => setSuccessMsg('')}>
              {successMsg}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2.2}>
              {/* First Name & Last Name (Create Account Only) */}
              {tab === 'register' && (
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    fullWidth
                    size="small"
                    label="First Name *"
                    required
                    placeholder="e.g. Maria"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Last Name *"
                    required
                    placeholder="e.g. Santos"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Stack>
              )}

              {/* Email Address */}
              <TextField
                fullWidth
                size="small"
                label="Email Address *"
                type="email"
                required
                placeholder="e.g. procurement@zcmc.gov.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Password */}
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  label={tab === 'register' ? 'Create Password *' : 'Password *'}
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={tab === 'register' ? 'Min 8 chars, 1 number, 1 symbol' : 'Enter your password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setShowPassword((prev) => !prev)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* Password Policy Indicator for Registration */}
                {tab === 'register' && password.length > 0 && (
                  <Box sx={{ mt: 1, p: 1.5, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', display: 'block', mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Password Requirements:
                    </Typography>
                    <Stack direction="column" spacing={0.7}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {hasMinLength ? (
                          <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        ) : (
                          <CancelOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: hasMinLength ? 700 : 500,
                            color: hasMinLength ? '#2563eb' : '#64748b',
                          }}
                        >
                          At least 8 characters
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {hasNumber ? (
                          <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        ) : (
                          <CancelOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: hasNumber ? 700 : 500,
                            color: hasNumber ? '#2563eb' : '#64748b',
                          }}
                        >
                          At least 1 number (0–9)
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {hasSpecial ? (
                          <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: '#10b981' }} />
                        ) : (
                          <CancelOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8' }} />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: hasSpecial ? 700 : 500,
                            color: hasSpecial ? '#2563eb' : '#64748b',
                          }}
                        >
                          At least 1 special character (!@#$%^&*...)
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}

                {/* Helper text when password field is empty in register mode */}
                {tab === 'register' && password.length === 0 && (
                  <FormHelperText sx={{ color: '#64748b', mt: 0.5 }}>
                    Must be at least 8 characters with at least 1 number and 1 special character.
                  </FormHelperText>
                )}

                {/* Forgot Password Link for Login */}
                {tab === 'login' && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.8 }}>
                    <Button
                      variant="text"
                      size="small"
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
                      sx={{
                        textTransform: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: '#2563eb',
                        p: 0,
                        '&:hover': { background: 'none', textDecoration: 'underline' },
                      }}
                    >
                      Forgot password?
                    </Button>
                  </Box>
                )}
              </Box>

              {/* Confirm Password (Matching Password for Create Account) */}
              {tab === 'register' && (
                <Box>
                  <TextField
                    fullWidth
                    size="small"
                    label="Confirm Password *"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-type your password to confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    error={passwordsMismatch}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PasswordIcon
                              fontSize="small"
                              sx={{
                                color: passwordsMismatch ? '#ef4444' : passwordsMatch ? '#10b981' : '#2563eb',
                              }}
                            />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            {passwordsMatch && (
                              <CheckCircleOutlinedIcon fontSize="small" sx={{ color: '#10b981', mr: 0.5 }} />
                            )}
                            <IconButton
                              size="small"
                              onClick={() => setShowConfirmPassword((prev) => !prev)}
                              edge="end"
                            >
                              {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  {passwordsMismatch && (
                    <FormHelperText sx={{ color: '#ef4444', fontWeight: 600, mt: 0.5 }}>
                      Passwords do not match.
                    </FormHelperText>
                  )}
                  {passwordsMatch && (
                    <FormHelperText sx={{ color: '#10b981', fontWeight: 600, mt: 0.5 }}>
                      Passwords match.
                    </FormHelperText>
                  )}
                </Box>
              )}

              {/* Status / Feature Badges */}
              {tab === 'register' ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, pt: 0.5 }}>
                  <MarkEmailReadOutlinedIcon sx={{ fontSize: 16, color: '#2563eb' }} />
                  <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                    A confirmation welcome email will be dispatched to your inbox.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, pt: 0.5 }}>
                  <SecurityIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                    Encrypted authentication & Sanctum token security active
                  </Typography>
                </Box>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.2,
                  fontWeight: 800,
                  backgroundColor: '#2563eb',
                  '&:hover': { backgroundColor: '#1d4ed8' },
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : tab === 'login' ? (
                  'Sign In to Catalogue'
                ) : (
                  'Create Catalogue Account'
                )}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password / SMTP Reset Dialog */}
      <Dialog
        open={forgotOpen}
        onClose={() => !forgotLoading && setForgotOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
          <LockResetIcon sx={{ color: '#2563eb', fontSize: 26 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Reset Password
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {forgotError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setForgotError('')}>
              {forgotError}
            </Alert>
          )}

          {forgotSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {forgotSuccess}
            </Alert>
          )}

          {forgotStep === 1 ? (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Enter your registered email address. We will dispatch a <strong>6-digit verification code</strong> via SMTP to reset your password.
              </Typography>
              <TextField
                fullWidth
                size="small"
                label="Registered Email Address"
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="e.g. yourname@zcmc.gov.ph"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                A 6-digit verification code was emailed to <strong>{forgotEmail}</strong>. Enter it below with your new password.
              </Typography>

              <TextField
                fullWidth
                size="small"
                label="6-Digit Reset Code"
                required
                value={forgotCode}
                onChange={(e) => setForgotCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="123456"
                inputProps={{
                  maxLength: 6,
                  style: { letterSpacing: '0.25em', fontWeight: 800, textAlign: 'center', fontSize: '1.2rem' },
                }}
              />

              <TextField
                fullWidth
                size="small"
                label="New Password"
                type={forgotShowPass ? 'text' : 'password'}
                required
                value={forgotNewPass}
                onChange={(e) => setForgotNewPass(e.target.value)}
                placeholder="Min 8 chars, 1 number, 1 special char"
                helperText="Must be at least 8 characters with at least 1 number and 1 special character."
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon fontSize="small" sx={{ color: '#2563eb' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => setForgotShowPass((prev) => !prev)}
                          edge="end"
                        >
                          {forgotShowPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                fullWidth
                size="small"
                label="Confirm New Password"
                type={forgotShowConfirmPass ? 'text' : 'password'}
                required
                value={forgotConfirmPass}
                onChange={(e) => setForgotConfirmPass(e.target.value)}
                placeholder="Re-type new password"
                error={forgotPasswordsMismatch}
                helperText={
                  forgotPasswordsMismatch
                    ? 'Passwords do not match.'
                    : forgotPasswordsMatch
                    ? 'Passwords match.'
                    : ''
                }
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <PasswordIcon
                          fontSize="small"
                          sx={{
                            color: forgotPasswordsMismatch
                              ? '#ef4444'
                              : forgotPasswordsMatch
                              ? '#10b981'
                              : '#2563eb',
                          }}
                        />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {forgotPasswordsMatch && (
                          <CheckCircleOutlinedIcon fontSize="small" sx={{ color: '#10b981', mr: 0.5 }} />
                        )}
                        <IconButton
                          size="small"
                          onClick={() => setForgotShowConfirmPass((prev) => !prev)}
                          edge="end"
                        >
                          {forgotShowConfirmPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Button
                  size="small"
                  onClick={handleSendResetCode}
                  disabled={forgotLoading}
                  sx={{ textTransform: 'none', color: '#2563eb', fontWeight: 600 }}
                >
                  Resend code
                </Button>
                <Button
                  size="small"
                  onClick={() => setForgotStep(1)}
                  disabled={forgotLoading}
                  sx={{ textTransform: 'none', color: '#64748b' }}
                >
                  Change email
                </Button>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setForgotOpen(false)}
            disabled={forgotLoading}
            sx={{ color: '#64748b', fontWeight: 600 }}
          >
            Cancel
          </Button>

          {forgotStep === 1 ? (
            <Button
              variant="contained"
              onClick={handleSendResetCode}
              disabled={forgotLoading || !forgotEmail.trim()}
              sx={{
                backgroundColor: '#2563eb',
                '&:hover': { backgroundColor: '#1d4ed8' },
                fontWeight: 700,
                minWidth: 140,
              }}
            >
              {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Send Code'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleResetPassword}
              disabled={
                forgotLoading ||
                forgotCode.length !== 6 ||
                !forgotPassValid ||
                forgotNewPass !== forgotConfirmPass
              }
              sx={{
                backgroundColor: '#2563eb',
                '&:hover': { backgroundColor: '#1d4ed8' },
                fontWeight: 700,
                minWidth: 140,
              }}
            >
              {forgotLoading ? <CircularProgress size={20} color="inherit" /> : 'Reset Password'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
