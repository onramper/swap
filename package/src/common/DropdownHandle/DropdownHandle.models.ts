export type DropdownHandleProps = {
  icon: string | undefined;
  fallbackIcon?: string;
  value: string;
  className?: string;
  iconClassname?: string;
  disabled?: boolean;
  onClick?: (value: string) => void;
};
