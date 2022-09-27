import React, { useCallback, useEffect, useState } from "react";
import styles from "./ViewList.module.css";
import { ViewListItemType, ViewListProps } from "./ViewList.models";
import ListItem from "./ViewListItem";
import SearchInput from "../SearchInput/SearchInput";
import { useVirtualizer } from "@tanstack/react-virtual";

const determineIsSmallScreen = () =>
  window.screen.height <= 615 || window.screen.width <= 575;

const ViewList: React.FC<ViewListProps> = (props: ViewListProps) => {
  const {
    onItemClick = () => null,
    onSearchBoxClick,
    items,
    searchable,
    onSearch,
  } = props;

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const { getTotalSize, getVirtualItems } = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    // getItemKey: (index) => items[index].address ?? index,
  });

  const [isSmallHeightScreen] = useState(determineIsSmallScreen());
  const [query, setQuery] = useState("");
  const [indexSelected, setIndexSelected] = useState(props.indexSelected);

  const handleItemClick = useCallback(
    (index: number, item: ViewListItemType) => {
      setIndexSelected(index);
      onItemClick(index, item);
    },
    [onItemClick]
  );

  const itemIsVisible = useCallback(
    (item: ViewListItemType) => {
      const searchWords = item.searchWords?.replace(/[+/-]/g, " ");
      return (
        item.name
          .toLowerCase()
          .split(" ")
          .some((substring) => substring.toLowerCase().startsWith(query)) ||
        item.name.toLowerCase().toLowerCase().startsWith(query) ||
        item.info
          ?.split(" ")
          .some((substring) => substring.toLowerCase().startsWith(query)) ||
        item.info?.toLowerCase().startsWith(query) ||
        item.network?.toLowerCase().startsWith(query) ||
        searchWords
          ?.split(" ")
          .some((substring) => substring.toLowerCase().startsWith(query)) ||
        searchWords?.toLowerCase().startsWith(query)
      );
    },
    [query]
  );

  useEffect(() => {
    onSearch(query);
  }, [onSearch, query]);

  return (
    <>
      {searchable && (
        <div className={styles["input-wrapper"]}>
          <SearchInput
            value={query}
            onChange={(value) => setQuery(value.toLowerCase())}
            autoFocus={!isSmallHeightScreen}
            onClick={onSearchBoxClick}
          />
        </div>
      )}
      <div
        ref={parentRef}
        style={{
          height: `100%`,
          overflow: "auto",
        }}
      >
        <ul
          className={`${styles.list}`}
          style={{
            height: `${getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {getVirtualItems().map((virtualItem) => {
            const item = items[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <ListItem
                  id={item.id}
                  key={virtualItem.key}
                  index={virtualItem.index}
                  name={item.name}
                  info={item.info}
                  icon={item.icon}
                  iconSvg={item.iconSvg}
                  network={item.network}
                  fallbackIcon={item.fallbackIcon}
                  onClick={() => handleItemClick(virtualItem.index, item)}
                  isSelected={indexSelected === virtualItem.index}
                  rightSection={item.rightSection}
                />
              </div>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default ViewList;
