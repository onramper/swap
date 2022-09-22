import React from "react";
import styles from "./ViewList.module.css";
import { ViewListItemProps } from "./ViewList.models";
import { ImageWithFallback } from "../ImageWithFallback/ImageWithFallback";

const ListItem: React.FC<ViewListItemProps> = (props: ViewListItemProps) => {
  return (
    <li
      className={`${props.isSelected ? styles["selected"] : ""}`}
      onClick={() => props.onClick(props.index)}
    >
      <ImageWithFallback
        alt="Icon"
        className={styles["list-item-icon"]}
        src={props.icon ?? props.fallbackIcon}
        fallbackSrc={props.fallbackIcon}
      />
      <div className={styles["list-item-child"]}>
        <div className={styles["list-item-name"]}> {props.name} </div>
        {props.info && (
          <div className={`${styles["list-item-info"]}`}> {props.info} </div>
        )}
      </div>

      {props.rightSection && <> {props.rightSection} </>}
    </li>
  );
};

export default ListItem;
