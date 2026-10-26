/** The Salient arrow, defined once per page and reused with <svg><use href="#mark" /></svg>. */
export function MarkSprite() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <symbol id="mark" viewBox="0 0 100 104">
          <path d="M50 0 L50 80 L4 104 Z" fill="#1E9E23" />
          <path d="M50 0 L96 104 L50 80 Z" fill="#5BD25F" />
        </symbol>
      </defs>
    </svg>
  );
}

export function Mark({ className, id }: { className?: string; id?: string }) {
  return (
    <svg className={className} id={id} aria-hidden="true">
      <use href="#mark" />
    </svg>
  );
}
