import React from "react";
import styles from "./DropdownHandle.module.css";
import arrowDownIcon from "./../../icons/arrow-down.svg";
import { DropdownHandleProps } from "./DropdownHandle.models";
import { ImageWithFallback } from "../ImageWithFallback/ImageWithFallback";

const DropdownHandle: React.FC<DropdownHandleProps> = ({
  icon,
  fallbackIcon,
  value,
  className,
  iconClassname,
  onClick,
  disabled = false,
}) => {
  return (
    <div
      className={`${styles["handle-wrapper"]} ${className || ""} ${
        disabled ? styles["disabled"] : ""
      }`}
      onClick={() => !disabled && onClick && onClick(value)}
    >
      <div
        className={`${styles["icon-handle-wrapper"]} ${iconClassname || ""}`}
      >
        <ImageWithFallback
          alt="icon-dropdown"
          className={styles["icon-handle"]}
          src={icon ?? fallbackIcon}
          fallbackSrc={fallbackIcon}
        />
      </div>

      <span className={styles["value-dropdown"]}>{value}</span>
      {!disabled && <img className={styles["icon-down"]} src={arrowDownIcon} />}
    </div>
  );
};

export default DropdownHandle;
