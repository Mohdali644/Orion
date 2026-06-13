"use client"

import { useState, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle2,
  Globe,
  GitBranch,
  AlertCircle,
  ChevronRight,
  LayoutDashboard,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { reposApi } from "@/lib/api"
import type { ConnectedRepo } from "@/lib/types"

type Repository = {
  owner: string
  name: string
}

// ──────────────────────────────────────────────────────────
// Stepper — 3-step progress indicator
// ──────────────────────────────────────────────────────────
function Stepper({ step }: { step: 2 | 3 }) {
  return (
    <div className="flex items-center justify-between mb-9 relative">
      <div className="absolute top-3 left-6 right-6 h-0.5 bg-[#E1E2EC] z-0" />
      <motion.div
        initial={{ width: "0%" }}
        animate={{ width: step === 3 ? "100%" : "50%" }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className="absolute top-3 left-6 h-0.5 bg-[#0969DA] z-10 origin-left"
      />

      {/* Step 1 — Connected */}
      <div className="relative z-20 flex flex-col items-center gap-2 bg-white px-2">
        <div className="w-[26px] h-[26px] rounded-full bg-[#1A7F37] text-white flex items-center justify-center border-2 border-white shadow-[0_0_0_2px_#A7F3D0]">
          <CheckCircle2 size={14} />
        </div>
        <span className="text-[11px] font-bold text-[#1A7F37]">Connected</span>
      </div>

      {/* Step 2 — Configure */}
      <div className="relative z-20 flex flex-col items-center gap-2 bg-white px-2">
        <div
          className={`w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 ${
            step === 3
              ? "bg-[#1A7F37] text-white shadow-[0_0_0_2px_#A7F3D0]"
              : "bg-[#F0F6FC] text-[#0969DA] shadow-[0_0_0_3px_#C2DBF5]"
          }`}
        >
          {step === 3 ? <CheckCircle2 size={14} /> : <span className="text-xs font-extrabold">2</span>}
        </div>
        <span className={`text-[11px] font-bold ${step === 3 ? "text-[#1A7F37]" : "text-[#0969DA]"}`}>
          Configure
        </span>
      </div>

      {/* Step 3 — Done */}
      <div className="relative z-20 flex flex-col items-center gap-2 bg-white px-2">
        <div
          className={`w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 border-white transition-all duration-300 ${
            step === 3
              ? "bg-[#F0F6FC] text-[#0969DA] shadow-[0_0_0_3px_#C2DBF5]"
              : "bg-[#F6F8FA] text-[#8B949E] shadow-[0_0_0_2px_#D0D7DE]"
          }`}
        >
          <span className="text-xs font-extrabold">3</span>
        </div>
        <span className={`text-[11px] font-bold ${step === 3 ? "text-[#0969DA]" : "text-[#8B949E]"}`}>
          Done
        </span>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Inner component
// ──────────────────────────────────────────────────────────
function ConnectCallbackInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [status, setStatus] = useState<"loading" | "syncing" | "configure" | "success" | "error">("loading")
  const [repo, setRepo] = useState<ConnectedRepo | null>(null)
  const [stagingUrl, setStagingUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [syncedCount, setSyncedCount] = useState(0)

  useEffect(() => {
    const handleInstallation = async () => {
      try {
        const installationId = searchParams.get("installation_id")
        const setupAction = searchParams.get("setup_action")

        if (!installationId) {
          setStatus("error")
          setErrorMessage("Missing installation ID. The installation may have failed.")
          return
        }

        console.log("GitHub setup action:", setupAction)
        setStatusMessage("Syncing your repositories...")
        setStatus("syncing")

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
          // createRepo might fail if repos already exist — that's okay, continue
          console.log("createRepo skipped or failed (may already exist):", createErr?.message)
        }

        // Fetch the connected repos to find our match
        setStatusMessage("Fetching repository details...")
        const reposList = await reposApi.getRepos()

        const matched = reposList.find(
          (r: ConnectedRepo) => String(r.installationId) === String(installationId)
        )

        if (matched) {
          setRepo(matched)
          setStagingUrl(matched.stagingUrl || "")

          // If repo already has staging URL, skip configure step
          if (matched.stagingUrl && matched.stagingUrl.trim()) {
            setStatus("success")
          } else {
            setStatus("configure")
          }
        } else {
          // Repo registered but not found in list yet — still show configure with what we have
          if (repositories.length > 0) {
            const firstRepo = repositories[0]!
            setRepo({
              id: installationId,
              name: firstRepo.name,
              owner: firstRepo.owner,
              fullName: `${firstRepo.owner}/${firstRepo.name}`,
              installationId,
              stagingUrl: "",
              passThreshold: 70,
              autoFixEnabled: true,
              status: "pending",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            } as ConnectedRepo)
            setStatus("configure")
          } else {
            setStatus("error")
            setErrorMessage("Repository was installed but we couldn't fetch its details. Please check your repos page.")
          }
        }
      } catch (err: any) {
        console.error("Installation callback error:", err)
        setStatus("error")
        setErrorMessage(err?.message || "Failed to sync repositories. Please try again.")
      }
    }

    handleInstallation()
  }, [searchParams])

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!repo || !stagingUrl.trim()) return

      try {
        setIsSaving(true)
        setSaveError(null)
        await reposApi.updateRepo(repo.id, { stagingUrl: stagingUrl.trim() })
        setStatus("success")
      } catch (err: any) {
        setSaveError(err?.message || "Failed to update staging URL. Please try again.")
      } finally {
        setIsSaving(false)
      }
    },
    [repo, stagingUrl]
  )

  return (
    <div className="min-h-screen bg-[#FAFBFC] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] bg-white rounded-3xl border border-[#F0F2F5] shadow-[0_8px_32px_rgba(15,23,42,0.04)] p-9 md:p-10 relative overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {/* ── Loading / Syncing State ── */}
          {(status === "loading" || status === "syncing") && (
            <motion.div
              key="loading"
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
                  {status === "loading" ? "Connecting your repo..." : "Syncing repositories..."}
                </h2>
                <p className="text-[13px] text-[#656D76]">
                  {status === "loading"
                    ? "Fetching installation details from GitHub."
                    : statusMessage}
                </p>
              </div>
            </motion.div>
          )}

          {/* ── Error State ── */}
          {status === "error" && (
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
              <p className="text-sm text-[#656D76] leading-relaxed">
                {errorMessage || "Something went wrong. The installation may not have completed."}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full">
                <a
                  href={process.env.NEXT_PUBLIC_GITHUB_APP_URL || "https://github.com/apps/orion-qa/installations/new"}
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

          {/* ── Configure State ── */}
          {status === "configure" && repo && (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Stepper step={2} />

              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-[#F0F6FC] text-[#0969DA] flex items-center justify-center border-4 border-[#C2DBF5] mb-4">
                  <CheckCircle2 size={30} />
                </div>
                <h1 className="bricolage font-extrabold text-[26px] text-[#1F2328] tracking-tight mb-2">
                  GitHub App Connected!
                </h1>
                <p className="text-sm text-[#656D76] leading-relaxed">
                  {syncedCount > 0
                    ? `${syncedCount} repositor${syncedCount > 1 ? "ies" : "y"} synced. Set the staging URL our agents will audit.`
                    : "Your repository was linked to Orion. Set the staging URL our agents will audit."}
                </p>
              </div>

              {/* Repo display */}
              <div className="bg-[#FAFBFC] border border-[#F0F2F5] rounded-xl p-4 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-[#D0D7DE] flex items-center justify-center shrink-0">
                  <GitBranch size={20} className="text-[#1F2328]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E] mb-0.5">
                    Connected Repo
                  </div>
                  <div className="bricolage font-bold text-[15px] text-[#1F2328] truncate">
                    <span className="text-[#656D76] font-medium">{repo.owner}/</span>
                    {repo.name}
                  </div>
                </div>
                <a
                  href={`https://github.com/${repo.owner}/${repo.name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B949E] hover:text-[#0969DA] transition-colors shrink-0"
                >
                  <ExternalLink size={16} />
                </a>
              </div>

              {/* Staging URL form */}
              <form onSubmit={handleSave} className="flex flex-col gap-3">
                <div>
                  <label className="block text-[13px] font-bold text-[#1F2328] mb-1.5">
                    Staging Environment URL
                  </label>
                  <div className="relative">
                    <Globe
                      size={15}
                      className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[#8B949E] pointer-events-none"
                    />
                    <input
                      type="url"
                      required
                      placeholder="https://your-staging.com"
                      value={stagingUrl}
                      onChange={(e) => setStagingUrl(e.target.value)}
                      disabled={isSaving}
                      className="w-full h-[46px] pl-[38px] pr-3.5 text-sm text-[#1F2328] font-mono bg-white border border-[#D0D7DE] rounded-xl outline-none focus:border-[#0969DA] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.14)] transition-all placeholder:text-[#8B949E] disabled:opacity-60"
                    />
                  </div>
                  {saveError && (
                    <p className="text-xs text-[#CF222E] font-semibold mt-1.5">{saveError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 mt-2">
                  <button
                    type="submit"
                    disabled={isSaving || !stagingUrl.trim()}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-[#0969DA] text-white font-bold text-sm rounded-xl hover:bg-[#0558B7] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-[0_2px_12px_rgba(9,105,218,0.28)]"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Setting up...
                      </>
                    ) : (
                      "Start Monitoring"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("success")}
                    className="text-[11.5px] text-[#8B949E] text-center font-medium hover:text-[#656D76] transition-colors"
                  >
                    Skip for now — you can change this later
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ── Success State ── */}
          {status === "success" && repo && (
            <motion.div
              key="success"
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
                You're all set!
              </h1>
              <p className="text-sm text-[#656D76] leading-relaxed mb-8 max-w-[320px]">
                {syncedCount > 0
                  ? `${syncedCount} repositor${syncedCount > 1 ? "ies" : "y"} synced and ready for auditing.`
                  : "We're ready to start auditing your repository for quality regressions."}
              </p>

              <div className="flex flex-col gap-3 w-full">
                {repo && repo.id !== repo.installationId ? (
                  <Link
                    href={`/repos/${repo.id}`}
                    className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#0969DA] text-white font-bold text-sm hover:bg-[#0558B7] hover:-translate-y-0.5 transition-all no-underline w-full shadow-[0_2px_12px_rgba(9,105,218,0.28)]"
                  >
                    <Search size={16} />
                    View Repo Details
                  </Link>
                ) : (
                  <Link
                    href="/repos"
                    className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#0969DA] text-white font-bold text-sm hover:bg-[#0558B7] hover:-translate-y-0.5 transition-all no-underline w-full shadow-[0_2px_12px_rgba(9,105,218,0.28)]"
                  >
                    <GitBranch size={16} />
                    View Repositories
                  </Link>
                )}
                <Link
                  href="/"
                  className="flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-[#F0F2F5] border border-[#D0D7DE] text-[#1F2328] font-bold text-sm hover:bg-[#E2E8F0] transition-colors no-underline w-full"
                >
                  <LayoutDashboard size={15} />
                  Go to Dashboard
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
export default function ConnectCallbackPage() {
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
      <ConnectCallbackInner />
    </Suspense>
  )
}