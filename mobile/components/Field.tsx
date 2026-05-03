import { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { fonts, theme } from "@/lib/theme";

type FieldProps = {
  label: string;
  hint?: string;
  rightLabel?: string;
  children: ReactNode;
};

export const Field = ({ label, hint, rightLabel, children }: FieldProps) => (
  <View style={styles.field}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {rightLabel ? <Text style={styles.right}>{rightLabel}</Text> : null}
    </View>
    {children}
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  field: { marginBottom: 16 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  right: {
    color: theme.textMuted,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
  hint: {
    color: theme.textDim,
    fontSize: 11,
    marginTop: 4,
  },
});
