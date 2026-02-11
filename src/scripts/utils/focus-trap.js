const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

let cleanupHandler = null;
let previousActiveElement = null;

export function createFocusTrap(container) {
  if (!container) {
    return () => {};
  }

  releaseFocusTrap();
  previousActiveElement = document.activeElement;

  const getFocusable = () => [...container.querySelectorAll(FOCUSABLE_SELECTOR)];

  const onKeyDown = (event) => {
    if (event.key !== 'Tab') {
      return;
    }

    const nodes = getFocusable();
    if (!nodes.length) {
      event.preventDefault();
      return;
    }

    const first = nodes[0];
    const last = nodes[nodes.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', onKeyDown);
  const nodes = getFocusable();
  if (nodes.length) {
    nodes[0].focus();
  }

  cleanupHandler = () => {
    document.removeEventListener('keydown', onKeyDown);
    if (previousActiveElement && previousActiveElement.focus) {
      previousActiveElement.focus();
    }
  };

  return cleanupHandler;
}

export function releaseFocusTrap() {
  if (cleanupHandler) {
    cleanupHandler();
    cleanupHandler = null;
  }
}
