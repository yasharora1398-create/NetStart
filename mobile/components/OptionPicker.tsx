import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, ChevronDown, X } from "lucide-react-native";
import { fonts, theme } from "@/lib/theme";

type OptionPickerProps = {
  value: string;
  onChange: (next: string) => void;
  options: string[];
  placeholder?: string;
  searchable?: boolean;
};

export const OptionPicker = ({
  value,
  onChange,
  options,
  placeholder = "Pick one",
  searchable = true,
}: OptionPickerProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query, searchable]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.trigger,
          pressed && { opacity: 0.85 },
        ]}
      >
        <Text style={[styles.triggerText, !value && { color: theme.textDim }]}>
          {value || placeholder}
        </Text>
        <ChevronDown size={16} color={theme.textMuted} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{placeholder}</Text>
              <Pressable onPress={close} hitSlop={12}>
                <X size={20} color={theme.textMuted} />
              </Pressable>
            </View>
            {searchable && (
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search..."
                placeholderTextColor={theme.textDim}
                style={styles.search}
                autoCapitalize="none"
              />
            )}
            <FlatList
              data={filtered}
              keyExtractor={(o) => o}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 32 }}
              renderItem={({ item }) => {
                const selected = item === value;
                return (
                  <Pressable
                    onPress={() => {
                      onChange(item);
                      close();
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && { backgroundColor: theme.bgElev },
                      selected && { backgroundColor: theme.goldGlow },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && { color: theme.gold },
                      ]}
                    >
                      {item}
                    </Text>
                    {selected ? <Check size={16} color={theme.gold} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
  },
  triggerText: { color: theme.text, fontSize: 15, flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.bg,
    borderTopWidth: 1,
    borderTopColor: theme.goldSoft,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "80%",
    padding: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sheetTitle: {
    color: theme.text,
    fontFamily: fonts.display,
    fontSize: 22,
  },
  search: {
    backgroundColor: theme.bgElev,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.text,
    fontSize: 15,
    marginBottom: 8,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  optionText: { color: theme.text, fontSize: 15 },
});
