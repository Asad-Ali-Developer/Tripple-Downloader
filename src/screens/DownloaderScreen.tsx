import React, { useRef, useState } from "react";
import {
  View,
  TextInput,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform as RNPlatform,
  ScrollView,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { fetchPreview } from "../api/downloader";
import { downloadToGallery } from "../utils/download";
import { MediaPreview, Platform } from "../types";

interface Props {
  platform: Platform;
  label: string;
  accentColor: string;
  accentColorDark: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function DownloaderScreen({
  platform,
  label,
  accentColor,
  accentColorDark,
  icon,
}: Props) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MediaPreview | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (fraction: number) => {
    setProgress(fraction);
    Animated.timing(progressAnim, {
      toValue: fraction,
      duration: 150,
      useNativeDriver: false,
    }).start();
  };

  const revealPreview = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setUrl(text.trim());
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const result = await fetchPreview(platform, url);
      setPreview(result);
      revealPreview();
    } catch (e: any) {
      setError(e?.message || "Something went wrong fetching that link.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!preview) return;
    setDownloading(true);
    animateProgress(0);
    try {
      await downloadToGallery(preview.downloadUrl, platform, animateProgress);
      Alert.alert(
        "Saved! 🎉",
        'Video saved to your gallery in the "TripleDownloader" album.',
      );
    } catch (e: any) {
      Alert.alert("Download failed", e?.message || "Something went wrong.");
    } finally {
      setDownloading(false);
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <LinearGradient
      colors={["#0b0b0f", "#141420", "#0b0b0f"]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={RNPlatform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <LinearGradient
              colors={[accentColor, accentColorDark]}
              style={styles.iconBadge}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={icon} size={26} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={styles.header}>{label}</Text>
              <Text style={styles.subheader}>Paste a link to fetch & save</Text>
            </View>
          </View>

          {/* Input */}
          <View style={styles.inputRow}>
            <Ionicons
              name="link-outline"
              size={18}
              color="#8b8b96"
              style={{ marginRight: 8 }}
            />
            <TextInput
              style={styles.input}
              placeholder={`Paste ${label} video link`}
              placeholderTextColor="#6b6b76"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity onPress={handlePaste} style={styles.pasteButton}>
              <Text style={[styles.pasteText, { color: accentColor }]}>
                Paste
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fetch button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleFetch}
            disabled={loading || !url.trim()}
            style={{ opacity: loading || !url.trim() ? 0.6 : 1 }}
          >
            <LinearGradient
              colors={[accentColor, accentColorDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="search"
                    size={18}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.buttonText}>Get Preview</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={18} color="#f87171" />
              <Text style={styles.error}>{error}</Text>
            </View>
          )}

          {/* Preview card */}
          {preview && (
            <Animated.View
              style={[
                styles.previewCard,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [16, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.thumbnailWrap}>
                {!!preview.thumbnail ? (
                  <Image
                    source={{ uri: preview.thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[accentColor, accentColorDark]}
                    style={[styles.thumbnail, styles.thumbnailFallback]}
                  >
                    <Ionicons
                      name={icon}
                      size={40}
                      color="rgba(255,255,255,0.85)"
                    />
                  </LinearGradient>
                )}
                <View
                  style={[
                    styles.platformBadge,
                    { backgroundColor: accentColor },
                  ]}
                >
                  <Ionicons name={icon} size={13} color="#fff" />
                </View>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {preview.title}
              </Text>
              {!!preview.author && (
                <View style={styles.authorRow}>
                  <Ionicons
                    name="person-circle-outline"
                    size={16}
                    color="#9ca3af"
                  />
                  <Text style={styles.author}>{preview.author}</Text>
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleDownload}
                disabled={downloading}
                style={{ marginTop: 14 }}
              >
                <LinearGradient
                  colors={["#22c55e", "#15803d"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.downloadButton}
                >
                  {downloading ? (
                    <>
                      <View style={styles.progressTrack}>
                        <Animated.View
                          style={[
                            styles.progressFill,
                            { width: progressWidth },
                          ]}
                        />
                      </View>
                      <Text style={styles.buttonText}>
                        {Math.round(progress * 100)}%
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons
                        name="cloud-download-outline"
                        size={18}
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.buttonText}>Download to Gallery</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 64, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  header: { fontSize: 22, fontWeight: "800", color: "#fff" },
  subheader: { fontSize: 13, color: "#8b8b96", marginTop: 2 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a22",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#26262f",
  },
  input: { flex: 1, color: "#fff", paddingVertical: 12, fontSize: 15 },
  pasteButton: { paddingHorizontal: 10, paddingVertical: 6 },
  pasteText: { fontWeight: "700", fontSize: 13 },
  primaryButton: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(248,113,113,0.1)",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 8,
  },
  error: { color: "#f87171", flex: 1, fontSize: 13, lineHeight: 18 },
  previewCard: {
    marginTop: 22,
    backgroundColor: "#16161d",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#25252f",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  thumbnailWrap: { position: "relative" },
  thumbnail: {
    width: "100%",
    height: 230,
    borderRadius: 14,
    backgroundColor: "#26262f",
  },
  thumbnailFallback: { alignItems: "center", justifyContent: "center" },
  platformBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#16161d",
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700", marginTop: 14 },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
  },
  author: { color: "#9ca3af", fontSize: 13 },
  downloadButton: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    overflow: "hidden",
  },
  progressTrack: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.25)",
  },
});
