import { Text } from "@/components/AppTypography";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type DropdownItem = {
  value: string;
  label: string;
  /** Extra text matched by search (e.g. dial code without +). */
  searchHint?: string;
  leading?: React.ReactNode;
};

type Props = {
  label?: string;
  placeholder: string;
  value: string;
  /** Shown in the closed field (e.g. "🇺🇸 United States"). */
  displayText: string;
  items: DropdownItem[];
  onSelect: (value: string) => void;
  /** Enable search box in modal (recommended for long lists). */
  searchable?: boolean;
  modalTitle: string;
  style?: StyleProp<ViewStyle>;
}

export function SelectDropdownField({
  label,
  placeholder,
  value,
  displayText,
  items,
  onSelect,
  searchable = true,
  modalTitle,
  style,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const pool = `${it.label} ${it.searchHint ?? ""} ${it.value}`.toLowerCase();
      return pool.includes(q);
    });
  }, [items, query]);

  const showText = displayText.trim() || placeholder;
  const isPlaceholder = !displayText.trim();

  const pick = (v: string) => {
    onSelect(v);
    setOpen(false);
    setQuery("");
  };

  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TouchableOpacity
        style={styles.field}
        onPress={() => setOpen(true)}
        activeOpacity={0.75}
      >
        <Text
          style={[styles.fieldText, isPlaceholder && styles.placeholderText]}
          numberOfLines={1}
        >
          {showText}
        </Text>
        <Ionicons name="chevron-down" size={22} color="#090040" />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent={false}>
        <View style={[styles.modalRoot, { paddingTop: insets.top + 8 }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setOpen(false)}
              hitSlop={12}
              style={styles.modalHeaderSide}
            >
              <Text style={styles.modalClose}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {modalTitle}
            </Text>
            <View style={styles.modalHeaderSide} />
          </View>
          {searchable ? (
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor="#888"
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(it) => it.value}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: winH * 0.72 }}
            renderItem={({ item }) => {
              const selected = item.value === value;
              return (
                <Pressable
                  style={[styles.row, selected && styles.rowSelected]}
                  onPress={() => pick(item.value)}
                >
                  {item.leading ? <View style={styles.leading}>{item.leading}</View> : null}
                  <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]} numberOfLines={2}>
                    {item.label}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark-circle" size={22} color="#090040" />
                  ) : null}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.empty}>No matches</Text>
            }
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#090040",
    marginBottom: 8,
    marginTop: 4,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "rgba(9, 0, 64, 0.08)",
  },
  fieldText: {
    flex: 1,
    fontSize: 16,
    color: "#111",
    marginRight: 8,
  },
  placeholderText: {
    color: "#889",
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(247, 247, 247, 1)",
    paddingHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalHeaderSide: {
    flex: 1,
  },
  modalClose: {
    fontSize: 16,
    color: "#090040",
  },
  modalTitle: {
    fontSize: 17,
    color: "#090040",
    flexShrink: 1,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(9, 0, 64, 0.08)",
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: "#111",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(9, 0, 64, 0.06)",
  },
  rowSelected: {
    borderColor: "#090040",
    backgroundColor: "rgba(9, 0, 64, 0.04)",
  },
  leading: {
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: "#111",
  },
  rowLabelSelected: {
    color: "#090040",
  },
  empty: {
    textAlign: "center",
    color: "#888",
    marginTop: 24,
    fontSize: 15,
  },
});
