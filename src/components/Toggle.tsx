interface Props {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? 'bg-gradient-to-r from-cyan-500 to-violet-500 shadow-md shadow-cyan-500/20'
          : 'bg-white/10'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-all duration-300 ${
          checked ? 'translate-x-[18px] scale-100' : 'translate-x-[3px] scale-90 opacity-60'
        }`}
      />
    </button>
  );
}
