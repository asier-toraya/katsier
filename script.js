const projectsButton = document.getElementById("projectsButton");
const closeProjectsButton = document.getElementById("closeProjectsButton");
const projectsSheet = document.getElementById("projectsSheet");

if (projectsButton && closeProjectsButton && projectsSheet) {
  const setOpenState = (isOpen) => {
    projectsSheet.classList.toggle("is-open", isOpen);
    projectsSheet.setAttribute("aria-hidden", String(!isOpen));
  };

  const closeIfClickedOutside = (event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }
    const clickedInsideSheet = projectsSheet.contains(target);
    const clickedTrigger = projectsButton.contains(target);
    if (!clickedInsideSheet && !clickedTrigger) {
      setOpenState(false);
    }
  };

  projectsButton.addEventListener("click", () => {
    const isOpen = projectsSheet.classList.contains("is-open");
    setOpenState(!isOpen);
  });

  closeProjectsButton.addEventListener("click", () => {
    setOpenState(false);
  });

  document.addEventListener("click", closeIfClickedOutside);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpenState(false);
    }
  });
}
