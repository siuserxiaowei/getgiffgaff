const SLOT_SELECTOR = '[data-growth-slot="wechat-buying-guide-v1"]';
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function nextFocusableIndex(currentIndex, total, backward = false) {
  if (!Number.isInteger(total) || total <= 0) return -1;
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= total) {
    return backward ? total - 1 : 0;
  }
  return backward
    ? (currentIndex - 1 + total) % total
    : (currentIndex + 1) % total;
}

function focusableElements(dialog) {
  return [...dialog.querySelectorAll(FOCUSABLE_SELECTOR)].filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.tabIndex >= 0,
  );
}

function clearDialogFragment(dialog) {
  if (location.hash !== `#${dialog.id}`) return;
  history.replaceState(null, "", `${location.pathname}${location.search}`);
}

export function initCommerceWidget(slot) {
  if (!slot || slot.dataset.commerceReady === "true") return null;
  const dialog = slot.querySelector(".commerce-guide-dialog");
  const openers = [...slot.querySelectorAll("[data-commerce-open]")];
  const closers = [...slot.querySelectorAll("[data-commerce-close]")];
  if (!dialog || openers.length === 0 || closers.length === 0) return null;

  slot.dataset.commerceReady = "true";
  let previousFocus = null;

  const restoreFocus = () => {
    const target = previousFocus?.isConnected ? previousFocus : openers[0];
    previousFocus = null;
    target?.focus?.();
  };

  const openDialog = (opener = document.activeElement) => {
    if (!dialog.open) {
      previousFocus = opener;
      dialog.setAttribute("aria-modal", "true");
      dialog.removeAttribute("aria-hidden");
      if (typeof dialog.showModal === "function") {
        try {
          dialog.showModal();
        } catch {
          dialog.setAttribute("open", "");
        }
      } else {
        dialog.setAttribute("open", "");
      }
    }
    const first = focusableElements(dialog)[0];
    first?.focus?.();
  };

  const closeDialog = ({ clearFragment = true, restore = true } = {}) => {
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
    dialog.setAttribute("aria-hidden", "true");
    dialog.removeAttribute("aria-modal");
    if (clearFragment) clearDialogFragment(dialog);
    if (restore) restoreFocus();
  };

  for (const opener of openers) {
    opener.addEventListener("click", (event) => {
      event.preventDefault();
      openDialog(opener);
    });
  }

  for (const closer of closers) {
    closer.addEventListener("click", (event) => {
      event.preventDefault();
      closeDialog();
    });
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;

    const focusable = focusableElements(dialog);
    const next = nextFocusableIndex(
      focusable.indexOf(document.activeElement),
      focusable.length,
      event.shiftKey,
    );
    if (next === -1) return;
    event.preventDefault();
    focusable[next].focus();
  });

  const syncWithFragment = () => {
    if (location.hash === `#${dialog.id}`) {
      openDialog(openers[0]);
    } else if (dialog.open) {
      closeDialog({ clearFragment: false });
    }
  };
  window.addEventListener("hashchange", syncWithFragment);

  if (location.hash === `#${dialog.id}`) {
    openDialog(openers[0]);
  } else {
    // aria-hidden is added only after JavaScript is active. Without JavaScript,
    // the :target dialog remains available to assistive technology.
    dialog.setAttribute("aria-hidden", "true");
  }

  return { dialog, openDialog, closeDialog };
}

function initializeAll() {
  for (const slot of document.querySelectorAll(SLOT_SELECTOR)) {
    initCommerceWidget(slot);
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeAll, { once: true });
  } else {
    initializeAll();
  }
}
