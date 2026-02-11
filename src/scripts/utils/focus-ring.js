const STATE_CLASS = 'using-keyboard';

export function initFocusRing() {
  const onKeyDown = (event) => {
    if (event.key === 'Tab') {
      document.body.classList.add(STATE_CLASS);
    }
  };

  const onPointer = () => {
    document.body.classList.remove(STATE_CLASS);
  };

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('mousedown', onPointer);
  document.addEventListener('touchstart', onPointer, { passive: true });

  return () => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('mousedown', onPointer);
    document.removeEventListener('touchstart', onPointer);
  };
}
