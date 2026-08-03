"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react"
import { changeUserPassword, getUserProfile, updateUserProfile, type UserProfile } from "@/lib/api"

// Module-level cache
let profileCache: UserProfile | null = null;

export function ProfileView() {
    const [profile, setProfile] = useState<UserProfile>(profileCache || {
        firstName: '',
        lastName: '',
        email: ''
    })
    const [originalEmail, setOriginalEmail] = useState(profileCache?.email || '')
    const [isLoading, setIsLoading] = useState(!profileCache)
    const [isSaving, setIsSaving] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMessage, setErrorMessage] = useState('')

    // Password for email change
    const [showPasswordField, setShowPasswordField] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // Password change state
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    })
    const [showSecurityPassword, setShowSecurityPassword] = useState({
        current: false,
        next: false,
        confirm: false,
    })
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [passwordError, setPasswordError] = useState('')

    useEffect(() => {
        loadProfile()
    }, [])

    // Check if email has changed to show password field
    useEffect(() => {
        const emailChanged = profile.email !== originalEmail && originalEmail !== ''
        setShowPasswordField(emailChanged)
        if (!emailChanged) {
            setCurrentPassword('')
        }
    }, [profile.email, originalEmail])

    const loadProfile = async () => {
        if (profileCache) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true)
            const data = await getUserProfile()
            setProfile(data)
            setOriginalEmail(data.email)
            profileCache = data;
        } catch (error) {
            console.error('Failed to load profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setSaveStatus('idle')
            setErrorMessage('')

            const updateData: any = {
                firstName: profile.firstName,
                lastName: profile.lastName,
            }

            // Only include email if it changed
            if (profile.email !== originalEmail) {
                updateData.email = profile.email
                updateData.currentPassword = currentPassword
            }

            const result = await updateUserProfile(updateData)

            if (result.success) {
                setSaveStatus('success')
                setOriginalEmail(profile.email)
                setShowPasswordField(false)
                setCurrentPassword('')

                // Update cache with new values
                if (profileCache) {
                    profileCache = { ...profile };
                } else {
                    profileCache = profile;
                }

                setTimeout(() => setSaveStatus('idle'), 3000)
            } else {
                setSaveStatus('error')
                setErrorMessage(result.error || 'Failed to update profile')
            }
        } catch (error: any) {
            setSaveStatus('error')
            setErrorMessage(error.message || 'Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const passwordRules = [
        { label: 'At least 8 characters', valid: passwordForm.newPassword.length >= 8 },
        { label: 'One uppercase letter', valid: /[A-Z]/.test(passwordForm.newPassword) },
        { label: 'One lowercase letter', valid: /[a-z]/.test(passwordForm.newPassword) },
        { label: 'One number', valid: /[0-9]/.test(passwordForm.newPassword) },
    ]

    const isPasswordFormValid =
        passwordForm.currentPassword.length > 0 &&
        passwordRules.every(rule => rule.valid) &&
        passwordForm.newPassword === passwordForm.confirmPassword &&
        passwordForm.newPassword.length > 0

    const handlePasswordChange = async () => {
        if (!isPasswordFormValid) {
            setPasswordStatus('error')
            setPasswordError(
                passwordForm.newPassword !== passwordForm.confirmPassword
                    ? 'New password and confirmation must match'
                    : 'Please complete all password requirements before saving'
            )
            return
        }

        try {
            setIsUpdatingPassword(true)
            setPasswordStatus('idle')
            setPasswordError('')

            const result = await changeUserPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            })

            if (result.success) {
                setPasswordStatus('success')
                setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                })
                setTimeout(() => setPasswordStatus('idle'), 3000)
            } else {
                setPasswordStatus('error')
                setPasswordError(result.error || 'Failed to update password')
            }
        } catch (error: any) {
            setPasswordStatus('error')
            setPasswordError(error.message || 'Failed to update password')
        } finally {
            setIsUpdatingPassword(false)
        }
    }

    const getInitials = () => {
        const first = profile.firstName?.[0]?.toUpperCase() || ''
        const last = profile.lastName?.[0]?.toUpperCase() || ''
        return first + last || profile.email?.[0]?.toUpperCase() || 'U'
    }

    if (isLoading) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Profile</h2>
                    <p className="text-muted-foreground">Manage your personal information.</p>
                </div>
                <Card className="bg-card border-border md:col-span-2">
                    <CardContent className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Profile</h2>
                <p className="text-muted-foreground">Manage your personal information.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-card border-border md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-foreground">Personal Information</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Update your photo and personal details here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-20 w-20 border-2 border-border">
                                <AvatarImage src="/avatars/01.png" alt="@user" />
                                <AvatarFallback className="bg-muted text-primary text-xl">{getInitials()}</AvatarFallback>
                            </Avatar>
                            <Button variant="outline" className="border-border text-muted-foreground hover:bg-accent hover:text-primary">
                                Change Avatar
                            </Button>
                        </div>

                        {/* Name Fields */}
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="first-name" className="text-foreground">First name</Label>
                                <Input
                                    id="first-name"
                                    placeholder="John"
                                    value={profile.firstName}
                                    onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name" className="text-foreground">Last name</Label>
                                <Input
                                    id="last-name"
                                    placeholder="Doe"
                                    value={profile.lastName}
                                    onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50"
                                />
                            </div>
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="john.doe@example.com"
                                value={profile.email}
                                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                                className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50"
                            />
                            {showPasswordField && (
                                <p className="text-xs text-amber-500">
                                    Email change requires password verification
                                </p>
                            )}
                        </div>

                        {/* Password Field (shown when email changes) */}
                        {showPasswordField && (
                            <div className="space-y-2 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <Label htmlFor="current-password" className="text-foreground">
                                    Current Password <span className="text-red-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="current-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Required to verify email change for security
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {saveStatus === 'error' && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {errorMessage}
                            </div>
                        )}

                        {/* Save Button */}
                        <div className="flex justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || (showPasswordField && !currentPassword)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : saveStatus === 'success' ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Saved!
                                    </>
                                ) : (
                                    'Save Profile'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-foreground">Security</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Change your account password from the dashboard.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="password-current" className="text-foreground">Current password</Label>
                                <div className="relative">
                                    <Input
                                        id="password-current"
                                        type={showSecurityPassword.current ? "text" : "password"}
                                        placeholder="Current password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                                        className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecurityPassword(prev => ({ ...prev, current: !prev.current }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showSecurityPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-new" className="text-foreground">New password</Label>
                                <div className="relative">
                                    <Input
                                        id="password-new"
                                        type={showSecurityPassword.next ? "text" : "password"}
                                        placeholder="New password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                        className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecurityPassword(prev => ({ ...prev, next: !prev.next }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showSecurityPassword.next ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password-confirm" className="text-foreground">Confirm new password</Label>
                                <div className="relative">
                                    <Input
                                        id="password-confirm"
                                        type={showSecurityPassword.confirm ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                        className="bg-muted/50 border-input text-foreground focus-visible:ring-primary/50 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecurityPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showSecurityPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <p className="mb-3 text-sm font-medium text-foreground">Password requirements</p>
                            <div className="grid gap-2 md:grid-cols-2">
                                {passwordRules.map((rule) => (
                                    <div key={rule.label} className={`text-sm ${rule.valid ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                        {rule.valid ? 'OK' : '•'} {rule.label}
                                    </div>
                                ))}
                                <div className={`text-sm ${passwordForm.confirmPassword.length === 0 || passwordForm.newPassword === passwordForm.confirmPassword ? 'text-muted-foreground' : 'text-destructive'}`}>
                                    {passwordForm.confirmPassword.length > 0 && passwordForm.newPassword !== passwordForm.confirmPassword ? '•' : 'OK'} Password confirmation matches
                                </div>
                            </div>
                        </div>

                        {passwordStatus === 'error' && (
                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {passwordError}
                            </div>
                        )}

                        {passwordStatus === 'success' && (
                            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-500 text-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Password updated successfully
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button
                                onClick={handlePasswordChange}
                                disabled={isUpdatingPassword || !isPasswordFormValid}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[160px]"
                            >
                                {isUpdatingPassword ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
