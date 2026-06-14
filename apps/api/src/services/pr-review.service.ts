import { db, prReviews, eq } from "@repo/db";
import { getPRFiles, getFileContent, getOctokit } from "./github.service";
import { ask, askJSON } from "@repo/agents";

const REVIEWABLE_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".vue", ".py",
  ".go", ".java", ".rb", ".php", ".cs", ".cpp", ".c",
  ".html", ".css", ".scss"
];

const MAX_FILES_TO_REVIEW = 10;
const MAX_FILE_SIZE_CHARS = 12000;

export interface PRReviewFinding {
  file: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  detail: string;
  impact?: string;
  line?: number;
  fixSuggestion?: string;
  confidence: "high" | "medium" | "low";
}

export async function runPRCodeReview(params: {
  owner: string;
  repo: string;
  prNumber: number;
  sha: string;
  installationId: string;
}): Promise<void> {
  const { owner, repo, prNumber, sha, installationId } = params;

  console.log(`[pr-review] starting review for ${owner}/${repo} PR #${prNumber} @ ${sha}`);

  // 1. Insert initial pending record
  const [record] = await db
    .insert(prReviews)
    .values({
      owner,
      repo,
      prNumber,
      sha,
      installationId,
      status: "pending",
    })
    .returning();

  if (!record) {
    console.error("[pr-review] failed to create pending review record");
    return;
  }

  const octokit = getOctokit(installationId);

  try {
    await octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state: "pending",
      context: "Orion AI / Code Review",
      description: "Reviewing pull request changes...",
      target_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pr-reviews/${record.id}`,
    });
  } catch (err) {
    console.error("[pr-review] failed to set pending commit status", err);
  }

  try {
    // 2. Fetch changed files
    const changedFiles = await getPRFiles(owner, repo, prNumber, installationId);
    const reviewableFiles = changedFiles.filter((f) =>
      REVIEWABLE_EXTENSIONS.some((ext) => f.filename.endsWith(ext))
    );

    const toReview = reviewableFiles.slice(0, MAX_FILES_TO_REVIEW);
    console.log(`[pr-review] reviewing ${toReview.length} files out of ${changedFiles.length} changed`);

    const allFindings: PRReviewFinding[] = [];

    // 3. Review each file in parallel/sequential
    for (const file of toReview) {
      try {
        console.log(`[pr-review] fetching content for ${file.filename}`);
        const contentData = await getFileContent(owner, repo, file.filename, installationId, sha);
        if (!contentData) {
          console.warn(`[pr-review] skipped ${file.filename} - could not read content`);
          continue;
        }

        const content = contentData.content;
        const truncated =
          content.length > MAX_FILE_SIZE_CHARS
            ? content.slice(0, MAX_FILE_SIZE_CHARS) + "\n... (truncated)"
            : content;

        console.log(`[pr-review] calling LLM for ${file.filename}`);
        const result = await askJSON<{
          findings: {
            severity: "critical" | "high" | "medium" | "low" | "info";
            confidence: "high" | "medium" | "low";
            title: string;
            detail: string;
            impact?: string;
            line?: number;
            fixSuggestion?: string;
          }[];
        }>(
          `You are a senior code reviewer and security engineer.
Review the code changes in the file. Focus on bugs, security issues, performance bottlenecks, accessibility issues, bad practices, and improvements that can be made.
Focus only on issues relevant to the file and its changes.
Respond ONLY with valid JSON in this exact shape:
{
  "findings": [
    {
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "confidence": "high" | "medium" | "low",
      "title": "short title",
      "detail": "specific explanation of the issue and what can be improved",
      "impact": "potential impact if this is not fixed",
      "line": <line number if identifiable, otherwise omit>,
      "fixSuggestion": "concrete fix suggestion / code snippet"
    }
  ]
}
If there are no issues, return { "findings": [] }.
Be specific and accurate.`,
          `File: ${file.filename}
${file.patch ? `Git diff (what changed):\n${file.patch}\n\n` : ""}Full file content:
${truncated}`
        );

        const fileFindings = result?.findings ?? [];
        console.log(`[pr-review] ${file.filename} reviewed: ${fileFindings.length} findings`);

        for (const f of fileFindings) {
          allFindings.push({
            file: file.filename,
            severity: f.severity,
            confidence: f.confidence,
            title: f.title,
            detail: f.detail,
            impact: f.impact,
            line: f.line,
            fixSuggestion: f.fixSuggestion,
          });
        }
      } catch (err) {
        console.error(`[pr-review] failed to review file ${file.filename}:`, err);
      }
    }

    // 4. Generate overall summary
    let summary = "No findings were discovered.";
    if (allFindings.length > 0) {
      try {
        const summaryPrompt = `You are a senior code reviewer. Write a brief overall summary (2-3 sentences max) of this pull request code review based on the files reviewed and findings discovered.
Files reviewed: ${toReview.map((f) => f.filename).join(", ")}
Findings: ${JSON.stringify(allFindings.map((f) => ({ file: f.file, severity: f.severity, title: f.title })))}
Return only the raw summary text without any markdown or formatting.`;

        summary = await ask(
          "Write a brief summary of the code review findings.",
          summaryPrompt,
          256
        );
      } catch (err) {
        console.error("[pr-review] failed to generate overall summary:", err);
        summary = "Completed code review on changed files.";
      }
    } else {
      summary = "🎉 Orion reviewed the PR code changes and found no issues! Great job.";
    }

    // 5. Format comment body
    const severityEmoji: Record<string, string> = {
      critical: "🔴 Critical",
      high: "🟠 High",
      medium: "🟡 Medium",
      low: "🔵 Low",
      info: "⚪ Info",
    };

    let findingsMarkdown = "";
    if (allFindings.length > 0) {
      // Group by file
      const grouped = allFindings.reduce((acc, f) => {
        if (!acc[f.file]) acc[f.file] = [];
        acc[f.file]!.push(f);
        return acc;
      }, {} as Record<string, PRReviewFinding[]>);

      findingsMarkdown = "\n### 🔍 Findings & Suggested Improvements\n\n";

      for (const [filename, fileFindings] of Object.entries(grouped)) {
        findingsMarkdown += `#### 📁 \`${filename}\`\n`;
        for (const f of fileFindings) {
          const lineStr = f.line ? ` *(Line ${f.line})*` : "";
          const emoji = severityEmoji[f.severity] ?? "⚪ Info";
          findingsMarkdown += `**${emoji} ${f.title}**${lineStr}\n\n`;
          findingsMarkdown += `> **Issue:** ${f.detail}\n>\n`;
          if (f.impact) {
            findingsMarkdown += `> **Potential Impact:** ${f.impact}\n\n`;
          } else {
            findingsMarkdown += `\n`;
          }
          if (f.fixSuggestion) {
            findingsMarkdown += `**💡 Simple Fix:**\n\`\`\`\n${f.fixSuggestion}\n\`\`\`\n`;
          }
          findingsMarkdown += "---\n\n";
        }
      }
    } else {
      findingsMarkdown = "\n🎉 **No issues or improvement suggestions were found. Excellent work!**\n";
    }

    const commentBody = `## 🤖 Orion PR Code Review Report

${summary}

---

### 📊 Review Overview
- **Files Reviewed:** ${toReview.length}
- **Total Suggestions:** ${allFindings.length}
${findingsMarkdown}

**[🔗 View Full PR Review Details in Orion UI](http://localhost:3000/pr-reviews/${record.id})**

---
*Powered by Orion QA Agent*`;

    // 6. Post comment to GitHub
    console.log(`[pr-review] posting comment to GitHub PR #${prNumber}`);
    const commentResponse = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: commentBody,
    });

    const commentUrl = commentResponse.data.html_url;

    // 6.5 Update Commit Status
    const hasCritical = allFindings.some(f => f.severity === "critical");
    const commitState = hasCritical ? "failure" : "success";
    const commitDescription = hasCritical 
      ? `Found ${allFindings.filter(f => f.severity === 'critical').length} critical issues. Please fix.`
      : "Code review passed. No critical issues.";

    try {
      await octokit.repos.createCommitStatus({
        owner,
        repo,
        sha,
        state: commitState,
        context: "Orion AI / Code Review",
        description: commitDescription.substring(0, 140), // GitHub description limit is 140 chars
        target_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pr-reviews/${record.id}`,
      });
    } catch (err) {
      console.error("[pr-review] failed to set final commit status", err);
    }

    // 7. Update DB record to complete
    await db
      .update(prReviews)
      .set({
        status: "complete",
        summary,
        findings: allFindings,
        totalFiles: toReview.length,
        totalFindings: allFindings.length,
        commentUrl,
        completedAt: new Date(),
      })
      .where(eq(prReviews.id, record.id));

    console.log(`[pr-review] completed successfully for PR #${prNumber}`);
  } catch (err) {
    console.error(`[pr-review] failed processing PR review for record ${record.id}:`, err);
    
    try {
      await octokit.repos.createCommitStatus({
        owner,
        repo,
        sha,
        state: "error",
        context: "Orion AI / Code Review",
        description: "An error occurred during the code review process.",
        target_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/pr-reviews/${record.id}`,
      });
    } catch (statusErr) {
      console.error("[pr-review] failed to set error commit status", statusErr);
    }

    await db
      .update(prReviews)
      .set({
        status: "failed",
        completedAt: new Date(),
      })
      .where(eq(prReviews.id, record.id));
  }
}
