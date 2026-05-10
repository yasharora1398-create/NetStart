/**
 * Top-level error boundary. Renders a friendly fallback when any
 * descendant throws during render or in a lifecycle method. Without
 * this, a single unhandled error white-screens the entire app.
 *
 * "Try again" resets the boundary's state - the rendered tree
 * unmounts and remounts, which clears most transient errors (a
 * missing image URL, a stale API response, etc.). Repeat crashes
 * after retry indicate the underlying bug.
 */
import { Component, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // In production this is where Sentry / Bugsnag would tag the
    // event. For now log to the JS console so it shows up in
    // Expo Go's debugger.
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.fill}>
        <Text style={styles.title}>Something broke</Text>
        <Text style={styles.body}>
          The screen ran into an unexpected error. Tapping Try again
          reloads the screen tree.
        </Text>
        <Text style={styles.detail} numberOfLines={5}>
          {this.state.error.message}
        </Text>
        <Pressable
          onPress={this.reset}
          style={({ pressed }) => [
            styles.btn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 10,
    backgroundColor: "#FAFAF7",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F1410",
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 13.5,
    color: "#4A4D52",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 320,
  },
  detail: {
    fontSize: 12,
    fontFamily: "Menlo",
    color: "#7A2620",
    textAlign: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(122,38,32,0.06)",
    borderRadius: 6,
    maxWidth: 360,
    marginTop: 8,
  },
  btn: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#1F5F3E",
  },
  btnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
