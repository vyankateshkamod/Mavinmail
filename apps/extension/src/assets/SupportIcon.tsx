
export const SupportIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Circle */}
    <circle cx="12" cy="12" r="10" />
    {/* Question mark */}
    <path d="M9.09 9a3 3 0 1 1 5.91 1c0 2-3 3-3 3" />
    {/* Dot */}
    <line x1="12" y1="17" x2="12" y2="17" />
  </svg>
);