import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function readProjectFile(relPath: string): string {
  const fullPath = path.join(ROOT, relPath);
  assert.ok(fs.existsSync(fullPath), `Expected file to exist: ${relPath}`);
  return fs.readFileSync(fullPath, "utf8");
}

function listAllSourceFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listAllSourceFiles(full));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(full);
    }
  }
  return files;
}

test("Phase 6 deliverables exist and document surveyed reference sources", () => {
  const skill = readProjectFile(".agents/skills/educare-uiux-performance/SKILL.md");
  assert.ok(skill.includes("Impeccable"), "SKILL.md must document Impeccable reference");
  assert.ok(skill.includes("UI UX Pro Max"), "SKILL.md must document UI UX Pro Max reference");
  assert.ok(skill.includes("EvondevKit"), "SKILL.md must document EvondevKit reference");
  assert.ok(skill.includes("prefers-reduced-motion"), "SKILL.md must include reduced motion guidance");

  const productSpec = readProjectFile("PRODUCT_SPEC.md");
  assert.ok(productSpec.includes("UNIGO"), "PRODUCT_SPEC.md must describe UNIGO domain");

  const designSpec = readProjectFile("DESIGN.md");
  assert.ok(designSpec.includes("#2563EB"), "DESIGN.md must document Ocean Blue #2563EB primary color");

  const motionSpec = readProjectFile("MOTION_SPEC.md");
  assert.ok(motionSpec.includes("cubic-bezier(0.22, 1, 0.36, 1)"), "MOTION_SPEC.md must document easing curve");

  const auditReport = readProjectFile("AUDIT_REPORT.md");
  assert.ok(auditReport.includes("F-01"), "AUDIT_REPORT.md must document initial findings");
});

test("Global error boundary and 404 not-found routes exist with skip link and main landmark", () => {
  const errorBoundary = readProjectFile("src/app/error.tsx");
  assert.ok(errorBoundary.includes('"use client"'), "error.tsx must be a Client Component");
  assert.ok(errorBoundary.includes('id="main-content"'), "error.tsx must expose #main-content");
  assert.ok(errorBoundary.includes("ErrorState"), "error.tsx must render ErrorState");

  const notFoundPage = readProjectFile("src/app/not-found.tsx");
  assert.ok(notFoundPage.includes('id="main-content"'), "not-found.tsx must expose #main-content");
  assert.ok(notFoundPage.includes("EmptyState"), "not-found.tsx must render EmptyState");
});

test("Zero blocking browser alert() calls remain in src/", () => {
  const srcDir = path.join(ROOT, "src");
  const files = listAllSourceFiles(srcDir);
  const offenders: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    if (/\balert\s*\(/.test(content)) {
      offenders.push(path.relative(ROOT, file));
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Found blocking alert() calls in: ${offenders.join(", ")}`
  );
});

test("Skip link and #main-content landmark exist across all standalone and shared page shells", () => {
  for (const relPath of [
    "src/components/layout/AppShell.tsx",
    "src/components/auth/AuthSplitShell.tsx",
    "src/app/page.tsx",
    "src/app/error.tsx",
    "src/app/not-found.tsx",
    "src/app/khong-co-quyen/page.tsx",
    "src/app/privacy/page.tsx",
    "src/app/terms/page.tsx",
  ]) {
    const content = readProjectFile(relPath);
    assert.ok(
      content.includes('href="#main-content"'),
      `${relPath} must include skip link href="#main-content"`
    );
    assert.ok(
      content.includes('id="main-content"'),
      `${relPath} must include <main id="main-content">`
    );
  }
});

test("Home portal avoids gradient clip-text anti-pattern on primary heading", () => {
  const homePage = readProjectFile("src/app/page.tsx");
  assert.ok(
    !homePage.includes("bg-clip-text text-transparent"),
    "src/app/page.tsx must not use bg-clip-text text-transparent on headings"
  );
});

test("Modal and Drawer implement full focus trap, Escape close, focus restoration, and aria-labelledby", () => {
  for (const relPath of ["src/components/ui/Modal.tsx", "src/components/ui/Drawer.tsx"]) {
    const content = readProjectFile(relPath);
    assert.ok(content.includes("createPortal"), `${relPath} must portal to document.body to escape transform containers`);
    assert.ok(content.includes('role="dialog"'), `${relPath} must set role="dialog"`);
    assert.ok(content.includes('aria-modal="true"'), `${relPath} must set aria-modal="true"`);
    assert.ok(content.includes("aria-labelledby"), `${relPath} must bind aria-labelledby to titleId`);
    assert.ok(content.includes("previousFocusRef"), `${relPath} must save and restore previous focus`);
    assert.ok(content.includes('e.key === "Tab"'), `${relPath} must trap Tab and Shift+Tab focus`);
    assert.ok(content.includes('e.key === "Escape"'), `${relPath} must close on Escape`);
  }

  // Drawer must not nest an <aside> complementary landmark inside role="dialog"
  const drawer = readProjectFile("src/components/ui/Drawer.tsx");
  assert.ok(
    !drawer.includes("<m.aside"),
    "Drawer.tsx must not render an <aside> landmark inside role=dialog"
  );
});

test("All feature dialogs use the shared accessible <Modal> component instead of ad-hoc fixed divs", () => {
  for (const relPath of [
    "src/app/hoc-sinh/cong-dong/page.tsx",
    "src/app/giao-vien/bai-giang/TeacherLessonsClient.tsx",
    "src/app/giao-vien/bai-tap/TeacherAssignmentsClient.tsx",
    "src/app/giao-vien/ngan-hang-cau-hoi/page.tsx",
    "src/app/hoc-sinh/xuong-tro-choi/page.tsx",
    "src/app/quan-tri/nguoi-dung/UserManagementTable.tsx",
  ]) {
    const content = readProjectFile(relPath);
    assert.ok(content.includes("<Modal"), `${relPath} must use the shared <Modal> component`);
  }
});

test("Tablists implement roving tabindex, Arrow/Home/End keyboard navigation, and aria-controls -> tabpanel", () => {
  for (const relPath of [
    "src/components/ui/Tabs.tsx",
    "src/app/dang-ky/page.tsx",
    "src/app/hoc-sinh/cong-dong/page.tsx",
  ]) {
    const content = readProjectFile(relPath);
    assert.ok(content.includes('role="tablist"'), `${relPath} must have role="tablist"`);
    assert.ok(content.includes("ArrowRight"), `${relPath} must support ArrowRight navigation`);
    assert.ok(content.includes("ArrowLeft"), `${relPath} must support ArrowLeft navigation`);
    assert.ok(content.includes("Home"), `${relPath} must support Home key`);
    assert.ok(content.includes("End"), `${relPath} must support End key`);
    assert.ok(content.includes("aria-controls"), `${relPath} must set aria-controls on tabs`);
  }

  for (const relPath of ["src/app/dang-ky/page.tsx", "src/app/hoc-sinh/cong-dong/page.tsx"]) {
    const content = readProjectFile(relPath);
    assert.ok(content.includes('role="tabpanel"'), `${relPath} must link tabs to role="tabpanel"`);
  }
});

test("No duplicate static id attributes exist within any single TSX file", () => {
  const srcDir = path.join(ROOT, "src");
  const files = listAllSourceFiles(srcDir);
  const duplicates: string[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const regex = /\bid="([^"]+)"/g;
    const seen = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      const idVal = match[1];
      if (seen.has(idVal)) {
        duplicates.push(`${path.relative(ROOT, file)}#${idVal}`);
      }
      seen.add(idVal);
    }
  }

  assert.deepEqual(
    duplicates,
    [],
    `Found duplicate static HTML id attributes: ${duplicates.join(", ")}`
  );
});

test("Navigation, menus, AI assistant, and reduced-motion safeguards are enforced", () => {
  const sidebar = readProjectFile("src/components/layout/AppSidebar.tsx");
  assert.ok(sidebar.includes("aria-current"), "AppSidebar.tsx must set aria-current on active links");

  const header = readProjectFile("src/components/layout/AppHeader.tsx");
  assert.ok(
    header.includes('aria-label="Tìm nhanh phân hệ (Ctrl+K)"'),
    "AppHeader.tsx must expose accessible mobile quick search trigger"
  );
  assert.ok(
    header.includes('aria-controls="header-profile-dropdown"') &&
      header.includes('aria-controls="header-notifications-panel"'),
    "AppHeader.tsx dropdowns must use WAI-ARIA disclosure aria-controls"
  );
  assert.ok(
    !header.includes('role="menu"') && !header.includes('role="menuitem"'),
    "AppHeader.tsx must not use role=menu/menuitem on a regular navigation dropdown"
  );
  assert.ok(
    header.includes("profileBtnRef.current?.focus()") &&
      header.includes("notifBtnRef.current?.focus()"),
    "AppHeader.tsx must restore focus to disclosure triggers when closed via Escape"
  );

  const aiAssistant = readProjectFile("src/components/ai/FloatingAIAssistant.tsx");
  assert.ok(aiAssistant.includes("inputRef.current?.focus()"), "FloatingAIAssistant must focus input when opened");
  assert.ok(aiAssistant.includes("fabRef.current?.focus()"), "FloatingAIAssistant must restore focus to FAB when closed");

  const globalsCss = readProjectFile("src/app/globals.css");
  assert.ok(
    globalsCss.includes("prefers-reduced-motion: reduce"),
    "globals.css must include @media (prefers-reduced-motion: reduce)"
  );

  const motionProvider = readProjectFile("src/components/ui/MotionProvider.tsx");
  assert.ok(
    motionProvider.includes('reducedMotion="user"'),
    "MotionProvider.tsx must configure reducedMotion='user'"
  );
});
