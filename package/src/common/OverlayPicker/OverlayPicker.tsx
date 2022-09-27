import React, { useCallback, useState } from "react";

import OverlayView from "../OverlayView/OverlayView";
import ViewList from "../ViewList/ViewList";
import { OverlayPickerProps } from "./OverlayPicker.models";

const PickView: React.FC<OverlayPickerProps> = (props) => {
  const { onItemClick = () => null, name = "" } = props;
  const [searchedItems, setSearchedItems] = useState<any>();

  const handleSearch = useCallback(
    (searchKey: string) => {
      if (searchKey) {
        const filteredItems = props.items.filter(
          (item) =>
            item.name.toUpperCase().includes(searchKey.toUpperCase()) ||
            item.info?.toUpperCase().includes(searchKey.toUpperCase())
        );
        setSearchedItems(filteredItems);
      } else {
        setSearchedItems(null);
      }
    },
    [props.items]
  );

  return (
    <OverlayView title={props.title}>
      <ViewList
        onItemClick={(index, item) => onItemClick(name, index, item)}
        items={searchedItems ?? props.items}
        searchable={!!props.searchable}
        indexSelected={props.indexSelected}
        onSearch={handleSearch}
      />
    </OverlayView>
  );
};

export default PickView;
