const projectsButton = document.getElementById("projectsButton");
const closeProjectsButton = document.getElementById("closeProjectsButton");
const projectsSheet = document.getElementById("projectsSheet");

const writeupsButton = document.getElementById("writeupsButton");
const closeWriteupsButton = document.getElementById("closeWriteupsButton");
const writeupsDrawer = document.getElementById("writeupsDrawer");
const writeupLinks = Array.from(document.querySelectorAll(".writeup-link"));

const writeupDetailSheet = document.getElementById("writeupDetailSheet");
const closeWriteupDetailButton = document.getElementById("closeWriteupDetailButton");
const writeupDetailLabel = document.getElementById("writeupDetailLabel");
const writeupDetailTitle = document.getElementById("writeupDetailTitle");
const writeupDetailParagraphA = document.getElementById("writeupDetailParagraphA");
const writeupDetailParagraphB = document.getElementById("writeupDetailParagraphB");
const writeupDetailImageA = document.getElementById("writeupDetailImageA");
const writeupDetailImageB = document.getElementById("writeupDetailImageB");

const writeupCatalog = {
  "placeholder-01": {
    label: "WRITE UP 01",
    title: "Placeholder Write-Up 01",
    paragraphA: "Placeholder text for your first write-up. Replace this with your own intro and context.",
    paragraphB:
      "Placeholder text for technical details, steps followed, and key takeaways for this write-up entry.",
    imageA: {
      src: "./images/NyxGuardImageL.png",
      alt: "Write-up 01 placeholder visual A",
    },
    imageB: {
      src: "./images/elastic.png",
      alt: "Write-up 01 placeholder visual B",
    },
  },
  "placeholder-02": {
    label: "WRITE UP 02",
    title: "Placeholder Write-Up 02",
    paragraphA: "Placeholder text for your second write-up. Replace this with a concise problem statement.",
    paragraphB:
      "Placeholder text for your method, findings, and final notes. You can also include commands or results.",
    imageA: {
      src: "./images/logo-ip-calculator.png",
      alt: "Write-up 02 placeholder visual A",
    },
    imageB: {
      src: "./images/NyxGuardImageL.png",
      alt: "Write-up 02 placeholder visual B",
    },
  },
  "placeholder-03": {
    label: "WRITE UP 03",
    title: "Placeholder Write-Up 03",
    paragraphA:
      "Placeholder text for your third write-up. Replace this section with your scenario and constraints.",
    paragraphB:
      "Placeholder text for lessons learned, remediation notes, references, or any post-analysis details.",
    imageA: {
      src: "./images/elastic.png",
      alt: "Write-up 03 placeholder visual A",
    },
    imageB: {
      src: "./images/logo-ip-calculator.png",
      alt: "Write-up 03 placeholder visual B",
    },
  },
};

const setPanelState = (panel, isOpen) => {
  if (!panel) {
    return;
  }
  panel.classList.toggle("is-open", isOpen);
  panel.setAttribute("aria-hidden", String(!isOpen));
};

const isPanelOpen = (panel) => Boolean(panel && panel.classList.contains("is-open"));

const populateWriteupDetail = (id) => {
  const entry = writeupCatalog[id] ?? writeupCatalog["placeholder-01"];
  if (!entry) {
    return;
  }

  if (writeupDetailLabel) {
    writeupDetailLabel.textContent = entry.label;
  }
  if (writeupDetailTitle) {
    writeupDetailTitle.textContent = entry.title;
  }
  if (writeupDetailParagraphA) {
    writeupDetailParagraphA.textContent = entry.paragraphA;
  }
  if (writeupDetailParagraphB) {
    writeupDetailParagraphB.textContent = entry.paragraphB;
  }
  if (writeupDetailImageA) {
    writeupDetailImageA.src = entry.imageA.src;
    writeupDetailImageA.alt = entry.imageA.alt;
  }
  if (writeupDetailImageB) {
    writeupDetailImageB.src = entry.imageB.src;
    writeupDetailImageB.alt = entry.imageB.alt;
  }
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

writeupLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const writeupId = link.dataset.writeupId ?? "placeholder-01";
    populateWriteupDetail(writeupId);
    setPanelState(writeupDetailSheet, true);
  });
});

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

  const clickedWriteupLink = writeupLinks.some((link) => link.contains(target));
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
