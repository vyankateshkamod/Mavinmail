"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getAvailableModels, getModelPreference, updateModelPreference, getGoogleCredentials, updateGoogleCredentials, getAdminOllamaModels, type AIModel } from "@/lib/api"
import { useSession } from "next-auth/react"

// Module-level cache
let settingsCache: {
    models: AIModel[];
    selectedModel: string;
} | null = null;

export function SettingsView() {
    const { data: session } = useSession()
    
    const [models, setModels] = React.useState<AIModel[]>(settingsCache?.models || [])
    const [selectedModel, setSelectedModel] = React.useState<string>(settingsCache?.selectedModel || "")
    const [loading, setLoading] = React.useState(!settingsCache)
    const [saving, setSaving] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [success, setSuccess] = React.useState<string | null>(null)

    // Custom Google Credentials state
    const [googleClientId, setGoogleClientId] = React.useState<string>("")
    const [googleClientSecret, setGoogleClientSecret] = React.useState<string>("")
    const [hasCustomGoogle, setHasCustomGoogle] = React.useState<boolean>(false)
    const [googleLoading, setGoogleLoading] = React.useState<boolean>(true)
    const [googleSaving, setGoogleSaving] = React.useState<boolean>(false)
    const [customGoogleToggle, setCustomGoogleToggle] = React.useState<boolean>(false)

    // Fetch models and user preference on mount
    React.useEffect(() => {
        const fetchData = async () => {
            if (settingsCache) {
                setLoading(false)
                return
            }

            try {
                const [availableModels, currentPreference, googleCreds] = await Promise.all([
                    getAvailableModels(),
                    getModelPreference(),
                    getGoogleCredentials()
                ])
                
                let allModels = [...availableModels];
                
                // If user is Admin, auto-fetch local Ollama models and append them
                const role = session?.user?.role;
                if (role === "ADMIN" || role === "SUPER_ADMIN") {
                    try {
                        const ollamaModels = await getAdminOllamaModels();
                        allModels = [...allModels, ...ollamaModels];
                    } catch (e) {
                        console.warn("Failed to fetch local Ollama models", e);
                    }
                }
                
                setModels(allModels)
                
                setGoogleClientId(googleCreds.googleClientId || "")
                setHasCustomGoogle(googleCreds.hasCustomCredentials)
                setCustomGoogleToggle(googleCreds.hasCustomCredentials)
                setGoogleLoading(false)

                // If user has a preference, use it. Otherwise use the default model from the list
                let newSelectedModel = "";
                if (currentPreference) {
                    newSelectedModel = currentPreference
                } else {
                    const defaultModel = allModels.find(m => m.isDefault)
                    newSelectedModel = defaultModel?.modelId || allModels[0]?.modelId || ""
                }
                setSelectedModel(newSelectedModel);

                // Update cache
                settingsCache = {
                    models: allModels,
                    selectedModel: newSelectedModel
                };

            } catch (err: any) {
                setError("Failed to load settings")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [session?.user?.role])

    // Clear success message after 3 seconds
    React.useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000)
            return () => clearTimeout(timer)
        }
    }, [success])

    const handleModelChange = async (modelId: string) => {
        setSelectedModel(modelId)
        setSaving(true)
        setError(null)

        try {
            await updateModelPreference(modelId)
            // Also save to localStorage for immediate use in API calls
            localStorage.setItem('selectedModel', modelId)

            // Update cache
            if (settingsCache) {
                settingsCache.selectedModel = modelId;
            }

            setSuccess("Model preference saved")
        } catch (err: any) {
            setError(err.message || "Failed to save preference")
        } finally {
            setSaving(false)
        }
    }

    const handleGoogleSave = async () => {
        if (!googleClientId || !googleClientSecret) {
            setError("Both Client ID and Secret are required to connect custom credentials.")
            return
        }
        setGoogleSaving(true)
        setError(null)
        try {
            await updateGoogleCredentials({ googleClientId, googleClientSecret })
            setSuccess("Custom Google credentials saved")
            setHasCustomGoogle(true)
            // Clear secret field for safety but keep ID visible
            setGoogleClientSecret("")
        } catch (err: any) {
            setError(err.message || "Failed to save Google credentials")
        } finally {
            setGoogleSaving(false)
        }
    }

    const handleGoogleClear = async () => {
        setGoogleSaving(true)
        setError(null)
        try {
            await updateGoogleCredentials({ googleClientId: "", googleClientSecret: "" })
            setSuccess("Custom Google credentials cleared")
            setGoogleClientId("")
            setGoogleClientSecret("")
            setHasCustomGoogle(false)
            setCustomGoogleToggle(false)
        } catch (err: any) {
            setError(err.message || "Failed to clear Google credentials")
        } finally {
            setGoogleSaving(false)
        }
    }

    const handleToggleCustomGoogle = async (checked: boolean) => {
        if (!checked) {
            // Turning OFF
            if (hasCustomGoogle) {
                if (window.confirm("Turning this off will clear your custom credentials. Are you sure?")) {
                    await handleGoogleClear();
                } else {
                    // Revert toggle visually if they cancel
                    setTimeout(() => setCustomGoogleToggle(true), 0);
                    return;
                }
            } else {
                setCustomGoogleToggle(false)
            }
        } else {
            // Turning ON
            setCustomGoogleToggle(true)
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
                <p className="text-muted-foreground">Manage your preferences and AI behavior.</p>
            </div>

            {/* Status Messages */}
            {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
            {success && (
                <div className="flex items-center gap-2 p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" />
                    {success}
                </div>
            )}

            <div className="grid gap-6">
                {/* AI Model Selection Card */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">AI Model</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Select the AI model used for email summaries, drafts, and chat.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading models...
                            </div>
                        ) : models.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No models available. Contact administrator.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                <Label htmlFor="ai-model">Preferred Model</Label>
                                <Select
                                    value={selectedModel}
                                    onValueChange={handleModelChange}
                                    disabled={saving}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {models.map((model) => (
                                            <SelectItem key={model.modelId} value={model.modelId}>
                                                <div className="flex items-center gap-2">
                                                    {model.displayName}
                                                    {model.isDefault && (
                                                        <span className="text-xs text-muted-foreground">(Default)</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {saving && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Saving...
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* AI Behavior Card */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">AI Behavior</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Configure how the AI interacts with your emails.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="auto-reply" className="text-foreground">Auto-reply</Label>
                                <p className="text-sm text-muted-foreground">Automatically reply to emails marked as 'Urgent' if I'm away.</p>
                            </div>
                            <Switch id="auto-reply" />
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="draft-mode" className="text-foreground">Draft Mode</Label>
                                <p className="text-sm text-muted-foreground">Only draft responses, never send without approval.</p>
                            </div>
                            <Switch id="draft-mode" defaultChecked />
                        </div>
                        <Separator className="bg-border" />
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="smart-summary" className="text-foreground">Smart Summary</Label>
                                <p className="text-sm text-muted-foreground">Generate a daily summary of all incoming emails.</p>
                            </div>
                            <Switch id="smart-summary" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Card */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Notifications</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Control when and how you receive alerts.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-alerts" className="text-foreground">Email Alerts</Label>
                                <p className="text-sm text-muted-foreground">Receive a weekly digest via email.</p>
                            </div>
                            <Switch id="email-alerts" defaultChecked />
                        </div>
                    </CardContent>
                </Card>

                {/* Custom Google Credentials Card */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground">Advanced: Google Credentials</CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Use your own Google Cloud Project to authenticate instead of Mavinmail's global credentials. <br />
                            <span className="text-xs">Go to Google Cloud Console, enable Gmail API, and create OAuth 2.0 Client credentials. Fill them in below.</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {googleLoading ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading credentials...
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between space-x-2 pb-4 border-b border-border/50">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-foreground">Use Custom Credentials</Label>
                                        <p className="text-sm text-muted-foreground">Turn on to use your own Google Cloud Project for Gmail instead of the Mavinmail default.</p>
                                    </div>
                                    <Switch 
                                        checked={customGoogleToggle} 
                                        onCheckedChange={handleToggleCustomGoogle} 
                                        disabled={googleSaving}
                                    />
                                </div>
                                {customGoogleToggle && (
                                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                                        {hasCustomGoogle ? (
                                            <div className="flex items-center gap-2 p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                                <CheckCircle2 className="w-4 h-4" />
                                                Custom credentials are currently active.
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground bg-secondary/20 border border-border/50 rounded-lg">
                                                Enter credentials to override the default global Mavinmail client.
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <Label htmlFor="google-client-id">Google Client ID</Label>
                                            <Input
                                                id="google-client-id"
                                                placeholder="e.g. 123456789-abc...apps.googleusercontent.com"
                                                value={googleClientId}
                                                onChange={(e) => setGoogleClientId(e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="google-client-secret">Google Client Secret {hasCustomGoogle && "(Hidden for security)"}</Label>
                                            <Input
                                                id="google-client-secret"
                                                type="password"
                                                placeholder={hasCustomGoogle ? "Leave empty to keep current secret or enter to replace" : "Enter client secret"}
                                                value={googleClientSecret}
                                                onChange={(e) => setGoogleClientSecret(e.target.value)}
                                                className="bg-background"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 pt-2">
                                            <Button 
                                                variant="default" 
                                                onClick={handleGoogleSave}
                                                disabled={googleSaving || (!googleClientSecret && !hasCustomGoogle)}
                                            >
                                                {googleSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Credentials
                                            </Button>
                                            {hasCustomGoogle && (
                                                <Button 
                                                    variant="destructive" 
                                                    onClick={handleGoogleClear}
                                                    disabled={googleSaving}
                                                >
                                                    Clear Credentials
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
                </div>
            </div>
        </div>
    )
}
