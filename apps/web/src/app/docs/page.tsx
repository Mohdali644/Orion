'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import {
  BookOpen,
  Play,
  GitBranch,
  Shield,
  Zap,
  Search,
  Target,
  Code,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Globe,
  Copy,
  Check,
} from 'lucide-react'
import Link from 'next/link'

// ──────────────────────────────────────────────────────────
// FAQ Item
// ──────────────────────────────────────────────────────────
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-[#F0F2F5] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-50/30 transition-colors"
      >
        <span className="text-sm font-semibold text-[#1f2937] pr-4">{question}</span>
        <ChevronRight
          className={`w-4 h-4 text-[#8B949E] shrink-0 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-[#6b7280] leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Code Block
// ──────────────────────────────────────────────────────────
function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative bg-[#1f2937] rounded-xl p-4 group">
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </button>
      <pre className="text-sm font-mono text-[#e1e8ed] overflow-x-auto">
        <code>{code}</code>
      </pre>
    </div>
  )
}

// ──────────────────────────────────────────────────────────
// Main Docs Page
// ──────────────────────────────────────────────────────────
export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffffff] via-[#f8f9fb] to-[#f0f3f8]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="bricolage font-extrabold text-4xl text-[#1f2937] mb-3">Documentation</h1>
          <p className="text-[#6b7280] text-lg">
            Everything you need to know about using Orion for automated quality assurance.
          </p>
        </div>

        <div className="flex flex-col gap-10">
          {/* ── Quickstart ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8"
          >
            <h2 className="bricolage font-bold text-2xl text-[#1f2937] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Play className="w-5 h-5 text-[#2563eb]" />
              </div>
              Quickstart Guide
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">Paste a URL</h3>
                  <p className="text-sm text-[#6b7280]">
                    Enter any public URL in the dashboard and click "Scan Now". Orion will crawl the page and run all active AI agents against it.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">Review Your Score</h3>
                  <p className="text-sm text-[#6b7280]">
                    Within minutes, you'll get a 0-100 quality score with detailed findings across performance, accessibility, and best practices. Scores above 80 are passing.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">Connect GitHub (Optional)</h3>
                  <p className="text-sm text-[#6b7280]">
                    Install the Orion GitHub App to automatically audit every push and pull request. Failing PRs can be blocked from merging, and Orion can auto-create fix PRs.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">Monitor & Improve</h3>
                  <p className="text-sm text-[#6b7280]">
                    Track your scores over time, compare runs, and use auto-fix PRs to resolve issues automatically. Set quality thresholds to enforce standards.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── Understanding Your Score ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8"
          >
            <h2 className="bricolage font-bold text-2xl text-[#1f2937] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#2563eb]" />
              </div>
              Understanding Your Score
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              {[
                { range: '80–100', color: '#1A7F37', label: 'Good', desc: 'Your site is well-optimized with minor or no issues.' },
                { range: '50–79', color: '#9A6700', label: 'Needs Work', desc: 'Several issues detected. Review and address findings.' },
                { range: '0–49', color: '#CF222E', label: 'Critical', desc: 'Significant problems found. Immediate attention recommended.' },
              ].map(({ range, color, label, desc }) => (
                <div key={range} className="p-4 rounded-xl bg-white border border-[#F0F2F5] text-center">
                  <p className="bricolage font-extrabold text-2xl mb-1" style={{ color }}>{range}</p>
                  <p className="text-sm font-semibold text-[#1f2937] mb-1">{label}</p>
                  <p className="text-xs text-[#6b7280]">{desc}</p>
                </div>
              ))}
            </div>

            <p className="text-sm text-[#6b7280] mb-4">
              Your score is calculated by four AI agents, each focusing on a different aspect of quality:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: Search, name: 'Discovery Agent', desc: 'Crawls pages, maps site structure, identifies all URLs' },
                { icon: Zap, name: 'Performance Agent', desc: 'Measures load times, Core Web Vitals, rendering performance' },
                { icon: Shield, name: 'Hygiene Agent', desc: 'Checks accessibility, SEO, security headers, best practices' },
                { icon: Target, name: 'Scoring Agent', desc: 'Aggregates all findings into a weighted 0-100 score' },
              ].map(({ icon: Icon, name, desc }) => (
                <div key={name} className="flex gap-3 p-3 rounded-lg hover:bg-blue-50/30 transition-colors">
                  <Icon className="w-4 h-4 text-[#2563eb] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#1f2937]">{name}</p>
                    <p className="text-xs text-[#6b7280]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── GitHub Integration ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8"
          >
            <h2 className="bricolage font-bold text-2xl text-[#1f2937] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-[#2563eb]" />
              </div>
              GitHub Integration
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-[#1A7F37] mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">Automatic PR Checks</h3>
                  <p className="text-sm text-[#6b7280]">
                    Every push and pull request is automatically audited. Results appear as status checks on your PRs — passing PRs show a green check, failing ones are flagged.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-[#1A7F37] mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">Block Failing PRs</h3>
                  <p className="text-sm text-[#6b7280]">
                    Set a quality threshold in Settings. PRs scoring below the threshold can be blocked from merging, ensuring only quality code reaches production.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-[#1A7F37] mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">Auto-Fix PRs</h3>
                  <p className="text-sm text-[#6b7280]">
                    When issues are found that AI can resolve, Orion automatically creates a new branch, applies the fix, and opens a PR for your review. Look for the purple "Create Fix PR" buttons on findings.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <CheckCircle2 className="w-5 h-5 text-[#1A7F37] mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-[#1f2937] mb-1">CI Pipeline Integration</h3>
                  <p className="text-sm text-[#6b7280]">
                    Orion integrates natively with GitHub Actions. Add it to your workflow to enforce quality gates before deployment.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ── API Reference ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8"
          >
            <h2 className="bricolage font-bold text-2xl text-[#1f2937] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-[#2563eb]" />
              </div>
              API Reference
            </h2>

            <p className="text-sm text-[#6b7280] mb-6">
              All API requests are made to <code className="bg-blue-50 px-1.5 py-0.5 rounded text-[#2563eb] font-mono text-xs">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1</code>.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#1f2937] mb-2">Create a Run</h3>
                <CodeBlock code={`POST /api/v1/runs
Content-Type: application/json

{
  "url": "https://example.com"
}`} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#1f2937] mb-2">Get Run Details</h3>
                <CodeBlock code={`GET /api/v1/runs/:runId`} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#1f2937] mb-2">List Connected Repos</h3>
                <CodeBlock code={`GET /api/v1/repos`} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-[#1f2937] mb-2">Compare Two Runs</h3>
                <CodeBlock code={`GET /api/v1/runs/:runId/compare?with=:otherRunId`} />
              </div>
            </div>
          </motion.section>

          {/* ── FAQ ── */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl border border-blue-100/40 bg-white/60 backdrop-blur-md p-6 md:p-8"
          >
            <h2 className="bricolage font-bold text-2xl text-[#1f2937] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[#2563eb]" />
              </div>
              Frequently Asked Questions
            </h2>

            <div className="space-y-2">
              <FaqItem
                question="How long does an audit take?"
                answer="Most audits complete in under 3 minutes. Complex sites with many pages may take longer. The time also depends on which agents are active and the site's response time."
              />
              <FaqItem
                question="Does Orion work with private sites?"
                answer="Orion audits publicly accessible URLs. For private sites, connect a GitHub repository with a staging URL — Orion will run audits as part of your CI pipeline where it has access to your environment."
              />
              <FaqItem
                question="What happens when a PR is blocked?"
                answer="When a PR scores below your quality threshold, Orion posts a failing status check. The PR can still be merged manually, but the failing check serves as a warning. You can configure branch protection rules in GitHub to enforce the check."
              />
              <FaqItem
                question="How do auto-fix PRs work?"
                answer="For findings marked as auto-fixable, Orion's AI generates a suggested fix. Clicking 'Create Fix PR' creates a new branch with the fix applied and opens a pull request for your review. You should always review auto-generated changes before merging."
              />
              <FaqItem
                question="Can I customize which checks run?"
                answer="Yes! Go to Settings → Active Agents to enable or disable individual agents. You can also set ignored paths and adjust the quality threshold to match your team's standards."
              />
              <FaqItem
                question="Is my data secure?"
                answer="Orion only accesses the URLs you provide. Audit results are stored securely. When connected to GitHub, Orion only accesses repository metadata and commit statuses — it never reads your source code unless creating an auto-fix PR."
              />
            </div>
          </motion.section>

          {/* ── Still need help? ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8"
          >
            <p className="text-[#6b7280] mb-4">Still have questions?</p>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#2563eb] text-white font-semibold rounded-xl hover:bg-[#1d4ed8] transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Visit GitHub Repository
            </a>
          </motion.div>
        </div>
      </main>
    </div>
  )
}