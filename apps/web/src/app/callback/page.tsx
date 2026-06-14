//web/src/app/callback/page.tsx
"use client"

import { useEffect, useState, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Globe,
  GitBranch,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
  Loader2,
  ExternalLink,
  Check,
  Settings,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { reposApi } from "@/lib/api"
import type { ConnectedRepo } from "@/lib/types"

type Repository = {
  owner: string
  name: string
}

type RepoConfig = {
  repoId: string
  fullName: string
  owner: string
  name: string
  stagingUrl: string
  passThreshold: number
  autoFix: boolean
  ignoredPaths: string
  selected: boolean
}

// ──────────────────────────────────────────────────────────
// Stepper — 3-step progress indicator
// ──────────────────────────────────────────────────────────
function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-between mb-9 relative">
      <div className="absolute top-3 left-6 right-6 h-0.5 bg-[#E1E2EC] z-0" />
      <motion.div
        initial={{ width: "0%" }}
        animate={{
          width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
        }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute top-3 left-6 h-0.5 bg-[#0969DA] z-10 origin-left"
      />

      {/* Step 1 — Connecting */}
      <div className="relative z-20 flex flex-col items-center gap-2 bg-white px-2">
        <div
          className={`w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 ${
            step >= 1
              ? "bg-[#1A7F37] text-white shadow-[0_0_0_2px_#A7F3D0]"
              : "bg-[#F0F6FC] text-[#0969DA] shadow-[0_0_0_3px_#C2DBF5]"
          }`}
        >
          {step >= 1 ? <CheckCircle2 size={14} /> : <span className="text-xs font-extrabold">1</span>}
        </div>
        <span className={`text-[11px] font-bold ${step >= 1 ? "text-[#1A7F37]" : "text-[#0969DA]"}`}>
          Connecting
        </span>
      </div>

      {/* Step 2 — Configure */}
      <div className="relative z-20 flex flex-col items-center gap-2 bg-white px-2">
        <div
          className={`w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 ${
            step >= 2
              ? "bg-[#1A7F37] text-white shadow-[0_0_0_2px_#A7F3D0]"
              : step === 1
              ? "bg-[#F0F6FC] text-[#0969DA] shadow-[0_0_0_3px_#C2DBF5]"
              : "bg-[#F6F8FA] text-[#8B949E] shadow-[0_0_0_2px_#D0D7DE]"
          }`}
        >
          {step >= 2 ? <CheckCircle2 size={14} /> : <span className="text-xs font-extrabold">2</span>}
        </div>
        <span
          className={`text-[11px] font-bold ${
            step >= 2 ? "text-[#1A7F37]" : step === 1 ? "text-[#0969DA]" : "text-[#8B949E]"
          }`}
        >
          Configure
        </span>
      </div>

      {/* Step 3 — Ready */}
      <div className="relative z-20 flex flex-col items-center gap-2 bg-white px-2">
        <div
          className={`w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 ${
            step >= 3
              ? "bg-[#1A7F37] text-white shadow-[0_0_0_2px_#A7F3D0]"
              : "bg-[#F6F8FA] text-[#8B949E] shadow-[0_0_0_2px_#D0D7DE]"
          }`}
        >
          {step >= 3 ? <CheckCircle2 size={14} /> : <span className="text-xs font-extrabold">3</span>}
        </div>
        <span className={`text-[11px] font-bold ${step >= 3 ? "text-[#1A7F37]" : "text-[#8B949E]"}`}>
          Ready
        </span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Inner component
// ──────────────────────────────────────────────────────────
function CallbackPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [repos, setRepos] = useState<RepoConfig[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [syncedCount, setSyncedCount] = useState(0)

  // Step 1: Connecting — Auto-sync repos
  useEffect(() => {
    const handleInstallation = async () => {
      try {
        const installationId = searchParams.get("installation_id")
        const setupAction = searchParams.get("setup_action")

        if (!installationId) {
          setErrorMessage("Missing installation ID. The installation may have failed.")
          return
        }

        console.log("GitHub setup action:", setupAction)
        setStatusMessage("Syncing your repositories...")

        // Parse repositories from URL params
        const repoParams = searchParams.getAll("repositories[]")
        const repositories: Repository[] = repoParams
          .map((repo) => {
            const [owner, name] = repo.split("/")
            if (!owner || !name) return null
            return { owner: owner.trim(), name: name.trim() }
          })
          .filter((repo): repo is Repository => repo !== null)

        // Register repos with backend
        try {
          await reposApi.createRepo({
            installationId,
            repositories: repositories.length > 0 ? repositories : undefined,
          })
          setSyncedCount(repositories.length || 1)
        } catch (createErr: any) {
          console.log("createRepo skipped or failed (may already exist):", createErr?.message)
        }

        // Fetch the connected repos
        setStatusMessage("Fetching repository details...")
        const reposList = await reposApi.getRepos()

        // Convert to config format with multi-select
        const repoConfigs = reposList
          .filter((r) => String(r.installationId) === String(installationId))
          .map((r) => ({
            repoId: r.id,
            fullName: r.fullName || `${r.owner}/${r.name}`,
            owner: r.owner,
            name: r.name,
            stagingUrl: r.stagingUrl || "",
            passThreshold: r.passThreshold || 70,
            autoFix: r.autoFixEnabled !== false,
            ignoredPaths: r.ignoredPaths || "",
            selected: true, // Default all to selected
          }))

        if (repoConfigs.length > 0) {
          setRepos(repoConfigs)
          setStep(2)
        } else {
          setErrorMessage("No repositories found. Please try installing again.")
        }
      } catch (err: any) {
        console.error("Installation callback error:", err)
        setErrorMessage(err?.message || "Failed to sync repositories. Please try again.")
      }
    }

    handleInstallation()
  }, [searchParams])

  // Step 2: Handle config updates
  const updateRepoConfig = useCallback((repoId: string, field: keyof RepoConfig, value: any) => {
    setRepos((prev) =>
      prev.map((r) => (r.repoId === repoId ? { ...r, [field]: value } : r))
    )
  }, [])

  // Step 3: Save configuration
  const handleSave = useCallback(async () => {
    const selectedRepos = repos.filter((r) => r.selected)

    if (selectedRepos.length === 0) {
      setErrorMessage("Please select at least one repository.")
      return
    }

    // Validate required fields
    const invalid = selectedRepos.find((r) => !r.stagingUrl.trim())
    if (invalid) {
      setErrorMessage("Please fill in the staging URL for all selected repositories.")
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)

      // Update each selected repo
      const updatePromises = selectedRepos.map((r) =>
        reposApi.updateRepo(r.repoId, {
          stagingUrl: r.stagingUrl.trim(),
          passThreshold: r.passThreshold,
          autoFixEnabled: r.autoFix,
          ignoredPaths: r.ignoredPaths.trim() || undefined,
        })
      )

      await Promise.all(updatePromises)
      setStep(3)
    } catch (err: any) {
      console.error("Save error:", err)
      setErrorMessage(err?.message || "Failed to save configuration. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }, [repos])

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[680px] bg-white rounded-3xl border border-[#F0F2F5] shadow-[0_8px_32px_rgba(15,23,42,0.04)] p-9 md:p-10 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {/* ── Step 1: Connecting ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-10"
            >
              <div className="w-11 h-11 rounded-xl bg-[#F0F6FC] border border-[#C2DBF5] flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[#0969DA] animate-spin" />
              </div>
              <div className="text-center">
                <h2 className="bricolage font-bold text-lg text-[#1F2328] mb-1">
                  Connecting your repo...
                </h2>
                <p className="text-[13px] text-[#656D76]">{statusMessage}</p>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Select & Configure ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Stepper step={2} />

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#F0F6FC] text-[#0969DA] flex items-center justify-center border-4 border-[#C2DBF5] mb-4">
                  <Settings size={30} />
                </div>
                <h1 className="bricolage font-extrabold text-[26px] text-[#1F2328] tracking-tight mb-2">
                  Configure Your Repos
                </h1>
                <p className="text-sm text-[#656D76] leading-relaxed">
                  Select which repositories to activate and set their configuration.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-[#FFEBE9] border border-[#FFCCC9] flex gap-3">
                  <AlertCircle className="w-5 h-5 text-[#CF222E] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#CF222E]">{errorMessage}</p>
                </div>
              )}

              {/* Repos List */}
              <div className="space-y-6 mb-8">
                {repos.map((repo) => (
                  <motion.div
                    key={repo.repoId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-[#F0F2F5] rounded-2xl p-6 bg-[#FAFBFC]"
                  >
                    {/* Repo Header with Checkbox */}
                    <div className="flex items-start gap-4 pb-6 border-b border-[#F0F2F5]">
                      <input
                        type="checkbox"
                        checked={repo.selected}
                        onChange={(e) => updateRepoConfig(repo.repoId, "selected", e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-[#D0D7DE] cursor-pointer accent-[#0969DA]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <GitBranch size={16} className="text-[#8B949E] shrink-0" />
                          <span className="bricolage font-bold text-[15px] text-[#1F2328]">
                            <span className="text-[#656D76] font-medium">{repo.owner}/</span>
                            {repo.name}
                          </span>
                          <a
                            href={`https://github.com/${repo.owner}/${repo.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#8B949E] hover:text-[#0969DA] transition-colors ml-auto shrink-0"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Config Fields (disabled if not selected) */}
                    <div className="space-y-5 pt-6 opacity-100">
                      {/* Staging URL */}
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                          Staging URL <span className="text-[#CF222E]">*</span>
                        </label>
                        <div className="relative">
                          <Globe
                            size={15}
                            className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[#8B949E] pointer-events-none"
                          />
                          <input
                            type="url"
                            placeholder="https://staging.example.com"
                            value={repo.stagingUrl}
                            onChange={(e) => updateRepoConfig(repo.repoId, "stagingUrl", e.target.value)}
                            disabled={!repo.selected || isSaving}
                            className="w-full h-[46px] pl-[38px] pr-3.5 text-sm text-[#1F2328] font-mono bg-white border border-[#D0D7DE] rounded-xl outline-none focus:border-[#0969DA] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.14)] transition-all placeholder:text-[#8B949E] disabled:opacity-60 disabled:bg-[#F6F8FA]"
                          />
                        </div>
                      </div>

                      {/* Pass Threshold */}
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                          Pass Threshold: <span className="text-[#0969DA]">{repo.passThreshold}</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={repo.passThreshold}
                          onChange={(e) => updateRepoConfig(repo.repoId, "passThreshold", parseInt(e.target.value))}
                          disabled={!repo.selected || isSaving}
                          className="w-full h-2 bg-[#D0D7DE] rounded-lg appearance-none cursor-pointer accent-[#0969DA] disabled:opacity-60"
                        />
                        <p className="text-xs text-[#656D76] mt-1.5">Quality score must be at least {repo.passThreshold}% to pass</p>
                      </div>

                      {/* Auto-Fix Toggle */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#D0D7DE]">
                        <span className="text-[13px] font-semibold text-[#1F2328]">Enable Auto-Fix PRs</span>
                        <button
                          type="button"
                          onClick={() => updateRepoConfig(repo.repoId, "autoFix", !repo.autoFix)}
                          disabled={!repo.selected || isSaving}
                          className={`relative w-12 h-6 rounded-full transition-colors ${
                            repo.autoFix ? "bg-[#1A7F37]" : "bg-[#D0D7DE]"
                          } disabled:opacity-60`}
                        >
                          <motion.div
                            animate={{ x: repo.autoFix ? 24 : 2 }}
                            transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5"
                          />
                        </button>
                      </div>

                      {/* Ignored Paths */}
                      <div>
                        <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                          Ignored Paths (optional)
                        </label>
                        <textarea
                          placeholder="dist, node_modules, .next&#10;(comma-separated, one per line)"
                          value={repo.ignoredPaths}
                          onChange={(e) => updateRepoConfig(repo.repoId, "ignoredPaths", e.target.value)}
                          disabled={!repo.selected || isSaving}
                          className="w-full h-[100px] p-3.5 text-sm text-[#1F2328] font-mono bg-white border border-[#D0D7DE] rounded-xl outline-none focus:border-[#0969DA] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.14)] transition-all placeholder:text-[#8B949E] disabled:opacity-60 disabled:bg-[#F6F8FA] resize-none"
                        />
                        <p className="text-xs text-[#656D76] mt-1.5">Paths to exclude from analysis</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={isSaving || repos.filter((r) => r.selected).length === 0}
                  className="w-full h-12 flex items-center justify-center gap-2 bg-[#0969DA] text-white font-bold text-sm rounded-xl hover:bg-[#0558B7] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_2px_12px_rgba(9,105,218,0.28)]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save & Activate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/repos")}
                  disabled={isSaving}
                  className="text-[11.5px] text-[#8B949E] text-center font-medium hover:text-[#656D76] transition-colors disabled:opacity-60"
                >
                  Skip for now — configure later
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Ready ── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center"
            >
              <Stepper step={3} />

              <div className="relative mb-5">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-[#E6F4EA] text-[#1A7F37] flex items-center justify-center border-[5px] border-[#A7F3D0]"
                >
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </motion.div>
              </div>

              <h1 className="bricolage font-extrabold text-[28px] text-[#1F2328] tracking-tight mb-2">
                Orion is now watching your repo
              </h1>
              <p className="text-sm text-[#656D76] leading-relaxed mb-8 max-w-[400px]">
                Every PR will be automatically audited for quality regressions. You'll get instant feedback and suggested fixes.
              </p>

              <div className="flex flex-col gap-3 w-full">
                <Link
                  href="/repos"
                  className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#0969DA] text-white font-bold text-sm hover:bg-[#0558B7] hover:-translate-y-0.5 transition-all no-underline w-full shadow-[0_2px_12px_rgba(9,105,218,0.28)]"
                >
                  <GitBranch size={16} />
                  View Dashboard
                </Link>
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#F0F2F5] border border-[#D0D7DE] text-[#1F2328] font-bold text-sm hover:bg-[#E2E8F0] transition-colors no-underline w-full"
                >
                  <LayoutDashboard size={15} />
                  Go to Home
                </Link>
              </div>
            </motion.div>
          )}

          {/* ── Error State ── */}
          {step === 1 && errorMessage && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 py-5 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#FFEBE9] text-[#CF222E] flex items-center justify-center mb-2 border-4 border-[#FEE2E2]">
                <AlertCircle size={32} />
              </div>
              <h1 className="bricolage font-extrabold text-2xl text-[#1F2328] tracking-tight mb-1">
                Installation Failed
              </h1>
              <p className="text-sm text-[#656D76] leading-relaxed">{errorMessage}</p>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
                <a
                  href={process.env.NEXT_PUBLIC_GITHUB_APP_URL || "https://github.com/apps/orion-qa-agent/installations/new"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0969DA] text-white font-bold text-sm hover:bg-[#0558B7] transition-colors no-underline"
                >
                  <GitBranch size={14} />
                  Try Again
                </a>
                <Link
                  href="/repos"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F2F5] border border-[#D0D7DE] text-[#1F2328] font-bold text-sm hover:bg-[#E2E8F0] transition-colors no-underline"
                >
                  Go to Repos
                  <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Page export with Suspense boundary
// ──────────────────────────────────────────────────────────
export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center">
          <div className="w-11 h-11 rounded-xl bg-[#F0F6FC] border border-[#C2DBF5] flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#0969DA] animate-spin" />
          </div>
        </div>
      }
    >
      <CallbackPageInner />
    </Suspense>
  )
}