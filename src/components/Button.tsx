type Props = {
    onClick: () => void;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export function Button({ onClick, children, className, style }: Props) {


    return (
        <button
          type="button"
          onClick={onClick}
          className={`transition-transform duration-100 ease-out active:translate-y-[2px] ${className}`}
          style={style}
        >
          {children}
        </button>
    )
}