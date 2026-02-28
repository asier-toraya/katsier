const projectsButton = document.getElementById("projectsButton");
const closeProjectsButton = document.getElementById("closeProjectsButton");
const projectsSheet = document.getElementById("projectsSheet");

const writeupsButton = document.getElementById("writeupsButton");
const closeWriteupsButton = document.getElementById("closeWriteupsButton");
const writeupsDrawer = document.getElementById("writeupsDrawer");
const writeupsList = document.getElementById("writeupsList");

const writeupDetailSheet = document.getElementById("writeupDetailSheet");
const closeWriteupDetailButton = document.getElementById("closeWriteupDetailButton");
const writeupDetailLabel = document.getElementById("writeupDetailLabel");
const writeupDetailTitle = document.getElementById("writeupDetailTitle");
const writeupDetailMarkdown = document.getElementById("writeupDetailMarkdown");
const writeupCover = document.getElementById("writeupCover");
const writeupCoverImage = document.getElementById("writeupCoverImage");
const writeupDetailMedia = document.getElementById("writeupDetailMedia");
const writeupDetailImageA = document.getElementById("writeupDetailImageA");
const writeupDetailImageB = document.getElementById("writeupDetailImageB");

if (window.marked && typeof window.marked.setOptions === "function") {
  window.marked.setOptions({
    gfm: true,
    breaks: true,
  });
}

const githubWriteupsApi = "https://api.github.com/repos/asier-toraya/katsier/contents/writeups?ref=master";
const fallbackWriteupPaths = ["./writeups/nyx-monitor.md", "./write-up.md"];

let writeupEntries = [];

const setPanelState = (panel, isOpen) => {
  if (!panel) {
    return;
  }
  panel.classList.toggle("is-open", isOpen);
  panel.setAttribute("aria-hidden", String(!isOpen));
};

const isPanelOpen = (panel) => Boolean(panel && panel.classList.contains("is-open"));

const escapeHtml = (text) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const basicMarkdownToHtml = (markdown) => {
  const lines = markdown.replace(/\r/g, "").split("\n");
  const html = [];
  let inCodeBlock = false;
  let inList = false;

  const closeList = () => {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();

    if (/^```/.test(line)) {
      closeList();
      if (inCodeBlock) {
        html.push("</code></pre>");
      } else {
        html.push("<pre><code>");
      }
      inCodeBlock = !inCodeBlock;
      return;
    }

    if (inCodeBlock) {
      html.push(`${escapeHtml(rawLine)}\n`);
      return;
    }

    if (!line) {
      closeList();
      return;
    }

    const heading3 = line.match(/^###\s+(.+)/);
    if (heading3) {
      closeList();
      html.push(`<h3>${escapeHtml(heading3[1].trim())}</h3>`);
      return;
    }

    const heading2 = line.match(/^##\s+(.+)/);
    if (heading2) {
      closeList();
      html.push(`<h2>${escapeHtml(heading2[1].trim())}</h2>`);
      return;
    }

    const heading1 = line.match(/^#\s+(.+)/);
    if (heading1) {
      closeList();
      html.push(`<h1>${escapeHtml(heading1[1].trim())}</h1>`);
      return;
    }

    const listItem = line.match(/^[-*]\s+(.+)/);
    if (listItem) {
      if (!inList) {
        html.push("<ul>");
        inList = true;
      }
      html.push(`<li>${escapeHtml(listItem[1].trim())}</li>`);
      return;
    }

    closeList();
    html.push(`<p>${escapeHtml(line)}</p>`);
  });

  if (inCodeBlock) {
    html.push("</code></pre>");
  }
  closeList();

  return html.join("");
};

const renderMarkdownToHtml = (markdown) => {
  if (window.marked && typeof window.marked.parse === "function") {
    return window.marked.parse(markdown);
  }
  return basicMarkdownToHtml(markdown);
};

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const stripQuotes = (value) => value.replace(/^['\"]|['\"]$/g, "").trim();

const parseFrontMatter = (rawMarkdown) => {
  const normalized = rawMarkdown.replace(/\r/g, "");
  const frontMatterMatch = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!frontMatterMatch) {
    return {
      metadata: {},
      markdown: normalized.trim(),
    };
  }

  const metadata = {};
  frontMatterMatch[1].split("\n").forEach((line) => {
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.+)$/);
    if (!match) {
      return;
    }
    metadata[match[1]] = stripQuotes(match[2]);
  });

  return {
    metadata,
    markdown: normalized.slice(frontMatterMatch[0].length).trim(),
  };
};

const getTitleFromMarkdown = (markdown) => {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
};

const getSummaryFromMarkdown = (markdown) => {
  const text = markdown
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[(.*?)\]\((.*?)\)/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/[*_`>|-]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return "Write-up without summary.";
  }

  if (text.length <= 150) {
    return text;
  }

  return `${text.slice(0, 150).trim()}...`;
};

const parseDateValue = (dateString) => {
  if (!dateString) {
    return 0;
  }
  const parsed = Date.parse(dateString);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeWriteupPath = (path) => {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("./") || path.startsWith("../")) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, "");
  if (cleanPath.startsWith("writeups/")) {
    return `./${cleanPath}`;
  }

  return `./writeups/${cleanPath}`;
};

const dedupe = (values) => Array.from(new Set(values.filter(Boolean)));

const loadWriteupPathsFromIndex = async () => {
  try {
    const response = await fetch("./writeups/index.json", { cache: "no-cache" });
    if (!response.ok) {
      return [];
    }

    const json = await response.json();
    if (!Array.isArray(json)) {
      return [];
    }

    return dedupe(
      json
        .map((item) => {
          if (typeof item === "string") {
            return normalizeWriteupPath(item);
          }
          if (item && typeof item === "object") {
            return normalizeWriteupPath(item.file || item.path || item.url || "");
          }
          return "";
        })
        .filter((item) => /\.md(\?|#|$)/i.test(item))
    );
  } catch (_error) {
    return [];
  }
};

const loadWriteupPathsFromDirectoryListing = async () => {
  try {
    const response = await fetch("./writeups/", { cache: "no-cache" });
    if (!response.ok) {
      return [];
    }

    const html = await response.text();
    const matches = Array.from(html.matchAll(/href=["']([^"']+\.md(?:[?#][^"']*)?)["']/gi));
    if (!matches.length) {
      return [];
    }

    return dedupe(
      matches
        .map((match) => match[1])
        .map((href) => {
          if (/^https?:\/\//i.test(href)) {
            return href;
          }

          const cleanHref = href.split("?")[0].split("#")[0];
          const fileName = cleanHref.split("/").pop();
          if (!fileName) {
            return "";
          }

          return normalizeWriteupPath(fileName);
        })
        .filter((item) => /\.md(\?|#|$)/i.test(item))
    );
  } catch (_error) {
    return [];
  }
};

const loadWriteupPathsFromGithubApi = async () => {
  try {
    const response = await fetch(githubWriteupsApi, {
      cache: "no-cache",
      headers: {
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return [];
    }

    return dedupe(
      data
        .filter((entry) => entry && entry.type === "file" && /\.md$/i.test(entry.name || ""))
        .map((entry) => entry.download_url || normalizeWriteupPath(`writeups/${entry.name}`))
    );
  } catch (_error) {
    return [];
  }
};

const discoverWriteupPaths = async () => {
  const fromIndex = await loadWriteupPathsFromIndex();
  if (fromIndex.length > 0) {
    return fromIndex;
  }

  const fromDirectory = await loadWriteupPathsFromDirectoryListing();
  if (fromDirectory.length > 0) {
    return fromDirectory;
  }

  const fromGithub = await loadWriteupPathsFromGithubApi();
  if (fromGithub.length > 0) {
    return fromGithub;
  }

  return fallbackWriteupPaths;
};

const parseWriteupEntry = (sourcePath, markdownText) => {
  const sourceName = sourcePath.split("/").pop()?.split("?")[0] || "writeup.md";
  const sourceSlug = slugify(sourceName.replace(/\.md$/i, "")) || "writeup";
  const fallbackTitle = sourceName.replace(/\.md$/i, "").replace(/[-_]+/g, " ").trim() || "Write-up";

  const { metadata, markdown } = parseFrontMatter(markdownText);
  const title = metadata.title || getTitleFromMarkdown(markdown) || fallbackTitle;
  const summary = metadata.summary || getSummaryFromMarkdown(markdown);

  return {
    id: metadata.id || sourceSlug,
    label: metadata.label || title.toUpperCase(),
    title,
    summary,
    date: metadata.date || "",
    markdown,
    cover: {
      src:
        metadata.coverImage ||
        metadata.cover_image ||
        metadata.cover ||
        metadata.headerImage ||
        metadata.header_image ||
        "",
      alt:
        metadata.coverAlt ||
        metadata.cover_alt ||
        metadata.headerImageAlt ||
        metadata.header_image_alt ||
        `${title} cover image`,
    },
    imageA: {
      src: metadata.imageA || metadata.image_a || "",
      alt: metadata.imageAAlt || metadata.image_a_alt || `${title} visual A`,
    },
    imageB: {
      src: metadata.imageB || metadata.image_b || "",
      alt: metadata.imageBAlt || metadata.image_b_alt || `${title} visual B`,
    },
  };
};

const loadWriteupEntryFromPath = async (sourcePath) => {
  try {
    const response = await fetch(sourcePath, { cache: "no-cache" });
    if (!response.ok) {
      return null;
    }

    const markdownText = await response.text();
    return parseWriteupEntry(sourcePath, markdownText);
  } catch (_error) {
    return null;
  }
};

const setWriteupsStatus = (message) => {
  if (!writeupsList) {
    return;
  }

  writeupsList.innerHTML = "";
  const statusNode = document.createElement("p");
  statusNode.className = "writeups-status";
  statusNode.id = "writeupsStatus";
  statusNode.textContent = message;
  writeupsList.appendChild(statusNode);
};

const renderWriteupsList = (entries) => {
  if (!writeupsList) {
    return;
  }

  writeupsList.innerHTML = "";

  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "writeup-link";
    button.dataset.writeupId = entry.id;

    const titleNode = document.createElement("strong");
    titleNode.textContent = entry.title;

    const summaryNode = document.createElement("span");
    summaryNode.textContent = entry.summary;

    button.appendChild(titleNode);
    button.appendChild(summaryNode);
    writeupsList.appendChild(button);
  });
};

const setDetailImage = (imageElement, imageData) => {
  if (!imageElement) {
    return;
  }

  if (imageData?.src) {
    imageElement.src = imageData.src;
    imageElement.alt = imageData.alt || "Write-up image";
    imageElement.hidden = false;
    return;
  }

  imageElement.removeAttribute("src");
  imageElement.alt = "";
  imageElement.hidden = true;
};

const populateWriteupDetail = (id) => {
  const entry = writeupEntries.find((item) => item.id === id) || writeupEntries[0];
  if (!entry) {
    return;
  }

  if (writeupDetailLabel) {
    writeupDetailLabel.textContent = entry.label || "WRITE UP";
  }

  if (writeupDetailTitle) {
    writeupDetailTitle.textContent = entry.title;
  }

  if (writeupDetailMarkdown) {
    writeupDetailMarkdown.innerHTML = renderMarkdownToHtml(entry.markdown || "");
  }

  setDetailImage(writeupCoverImage, entry.cover);
  if (writeupCover) {
    writeupCover.hidden = !entry.cover?.src;
  }

  setDetailImage(writeupDetailImageA, entry.imageA);
  setDetailImage(writeupDetailImageB, entry.imageB);

  if (writeupDetailMedia) {
    const shouldShowMedia = Boolean(entry.imageA?.src || entry.imageB?.src);
    writeupDetailMedia.hidden = !shouldShowMedia;
  }
};

const loadWriteups = async () => {
  if (!writeupsList) {
    return;
  }

  setWriteupsStatus("Loading write-ups...");

  const writeupPaths = dedupe(await discoverWriteupPaths());
  const loadedEntries = (
    await Promise.all(writeupPaths.map((writeupPath) => loadWriteupEntryFromPath(writeupPath)))
  ).filter(Boolean);

  const sortedEntries = loadedEntries
    .slice()
    .sort((a, b) => parseDateValue(b.date) - parseDateValue(a.date) || a.title.localeCompare(b.title));

  const usedIds = new Set();
  writeupEntries = sortedEntries.map((entry) => {
    const baseId = entry.id || slugify(entry.title) || "writeup";
    let resolvedId = baseId;
    let suffix = 2;

    while (usedIds.has(resolvedId)) {
      resolvedId = `${baseId}-${suffix}`;
      suffix += 1;
    }

    usedIds.add(resolvedId);
    return {
      ...entry,
      id: resolvedId,
    };
  });

  if (writeupEntries.length === 0) {
    setWriteupsStatus("No write-ups found. Add .md files to /writeups.");
    return;
  }

  renderWriteupsList(writeupEntries);
};

if (projectsButton && closeProjectsButton && projectsSheet) {
  projectsButton.addEventListener("click", () => {
    setPanelState(projectsSheet, !isPanelOpen(projectsSheet));
  });

  closeProjectsButton.addEventListener("click", () => {
    setPanelState(projectsSheet, false);
  });
}

if (writeupsButton && closeWriteupsButton && writeupsDrawer) {
  writeupsButton.addEventListener("click", () => {
    setPanelState(writeupsDrawer, !isPanelOpen(writeupsDrawer));
  });

  closeWriteupsButton.addEventListener("click", () => {
    setPanelState(writeupsDrawer, false);
  });
}

if (writeupDetailSheet && closeWriteupDetailButton) {
  closeWriteupDetailButton.addEventListener("click", () => {
    setPanelState(writeupDetailSheet, false);
  });
}

if (writeupsList) {
  writeupsList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const writeupLink = target.closest(".writeup-link");
    if (!(writeupLink instanceof HTMLButtonElement)) {
      return;
    }

    const writeupId = writeupLink.dataset.writeupId;
    if (!writeupId) {
      return;
    }

    populateWriteupDetail(writeupId);
    setPanelState(writeupDetailSheet, true);
  });
}

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (isPanelOpen(projectsSheet) && !projectsSheet.contains(target) && !projectsButton?.contains(target)) {
    setPanelState(projectsSheet, false);
  }

  if (isPanelOpen(writeupsDrawer) && !writeupsDrawer.contains(target) && !writeupsButton?.contains(target)) {
    setPanelState(writeupsDrawer, false);
  }

  const clickedWriteupLink = target instanceof Element ? target.closest(".writeup-link") : null;
  if (isPanelOpen(writeupDetailSheet) && !writeupDetailSheet.contains(target) && !clickedWriteupLink) {
    setPanelState(writeupDetailSheet, false);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  setPanelState(projectsSheet, false);
  setPanelState(writeupsDrawer, false);
  setPanelState(writeupDetailSheet, false);
});

const initBackgroundParallax = () => {
  const root = document.documentElement;
  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let rafId = 0;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const applyOffset = () => {
    root.style.setProperty("--bg-offset-x", `${currentX.toFixed(2)}px`);
    root.style.setProperty("--bg-offset-y", `${currentY.toFixed(2)}px`);
  };

  const animate = () => {
    currentX += (targetX - currentX) * 0.08;
    currentY += (targetY - currentY) * 0.08;
    applyOffset();

    if (Math.abs(targetX - currentX) < 0.05 && Math.abs(targetY - currentY) < 0.05) {
      rafId = 0;
      return;
    }

    rafId = window.requestAnimationFrame(animate);
  };

  const requestTick = () => {
    if (rafId) {
      return;
    }
    rafId = window.requestAnimationFrame(animate);
  };

  const resetParallax = () => {
    targetX = 0;
    targetY = 0;
    requestTick();
  };

  const updateByPointer = (clientX, clientY) => {
    if (reducedMotionQuery.matches) {
      return;
    }

    const maxOffset = coarsePointerQuery.matches ? 3 : 8;
    const xRatio = clientX / window.innerWidth - 0.5;
    const yRatio = clientY / window.innerHeight - 0.5;
    targetX = clamp(xRatio * maxOffset * -1, -maxOffset, maxOffset);
    targetY = clamp(yRatio * maxOffset * -1, -maxOffset, maxOffset);
    requestTick();
  };

  const handlePointerMove = (event) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
      return;
    }
    updateByPointer(event.clientX, event.clientY);
  };

  const handleScroll = () => {
    if (reducedMotionQuery.matches || !coarsePointerQuery.matches) {
      return;
    }

    const maxOffset = 2;
    const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = window.scrollY / maxScrollable;
    targetY = clamp((progress - 0.5) * maxOffset * 2, -maxOffset, maxOffset);
    requestTick();
  };

  const onReducedMotionChange = () => {
    if (reducedMotionQuery.matches) {
      targetX = 0;
      targetY = 0;
      currentX = 0;
      currentY = 0;
      applyOffset();
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    }
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("blur", resetParallax);
  document.addEventListener("pointerleave", resetParallax);
  window.addEventListener("scroll", handleScroll, { passive: true });

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);
  } else if (typeof reducedMotionQuery.addListener === "function") {
    reducedMotionQuery.addListener(onReducedMotionChange);
  }
};

loadWriteups();
initBackgroundParallax();
