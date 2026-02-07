'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useRequestOtp, useResetPassword } from '@/hooks/use-auth';
import { OtpInput } from '@/components/auth/otp-input';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
});

const resetSchema = z
  .object({
    code: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain an uppercase letter')
      .regex(/[a-z]/, 'Password must contain a lowercase letter')
      .regex(/[0-9]/, 'Password must contain a number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PhoneForm = z.infer<typeof phoneSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'phone' | 'reset' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestOtp = useRequestOtp();
  const resetPassword = useResetPassword();

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
  });

  const resetForm = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  const onPhoneSubmit = async (data: PhoneForm) => {
    setError(null);
    try {
      await requestOtp.mutateAsync({ phone: data.phone, purpose: 'reset_password' });
      setPhone(data.phone);
      setStep('reset');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    }
  };

  const onResetSubmit = async (data: ResetForm) => {
    setError(null);
    try {
      await resetPassword.mutateAsync({
        phone,
        code: data.code,
        newPassword: data.newPassword,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    }
  };

  if (step === 'success') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Password Reset</CardTitle>
          <CardDescription className="text-center">
            Your password has been successfully reset
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link href="/login" className="w-full">
            <Button className="w-full">Back to Login</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (step === 'reset') {
    return (
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter the OTP sent to {phone} and your new password
          </CardDescription>
        </CardHeader>
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
          <CardContent className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label>OTP Code</Label>
              <OtpInput length={6} onChange={(value) => resetForm.setValue('code', value)} />
              {resetForm.formState.errors.code && (
                <p className="text-sm text-red-500">{resetForm.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" {...resetForm.register('newPassword')} />
              {resetForm.formState.errors.newPassword && (
                <p className="text-sm text-red-500">
                  {resetForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...resetForm.register('confirmPassword')}
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={resetForm.formState.isSubmitting}>
              {resetForm.formState.isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setStep('phone')}
            >
              Back
            </Button>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
        <CardDescription className="text-center">
          Enter your phone number to receive a reset code
        </CardDescription>
      </CardHeader>
      <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)}>
        <CardContent className="space-y-4">
          {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="9876543210"
              {...phoneForm.register('phone')}
            />
            {phoneForm.formState.errors.phone && (
              <p className="text-sm text-red-500">{phoneForm.formState.errors.phone.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={phoneForm.formState.isSubmitting}>
            {phoneForm.formState.isSubmitting ? 'Sending...' : 'Send Reset Code'}
          </Button>
          <Link href="/login" className="text-sm text-center text-primary hover:underline">
            Back to Login
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}
