import React, { useState } from 'react';
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
} from 'react-native';
import { fetchPreview } from '../api/downloader';
import { downloadToGallery } from '../utils/download';
import { MediaPreview, Platform } from '../types';

interface Props {
  platform: Platform;
  label: string;
  accentColor: string;
}

export default function DownloaderScreen({ platform, label, accentColor }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<MediaPreview | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const result = await fetchPreview(platform, url);
      setPreview(result);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong fetching that link.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!preview) return;
    setDownloading(true);
    setProgress(0);
    try {
      await downloadToGallery(preview.downloadUrl, platform, setProgress);
      Alert.alert('Saved!', 'Video saved to your gallery in the "TripleDownloader" album.');
    } catch (e: any) {
      Alert.alert('Download failed', e?.message || 'Something went wrong.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={RNPlatform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.header}>{label} Downloader</Text>

        <TextInput
          style={styles.input}
          placeholder={`Paste ${label} video link here`}
          placeholderTextColor="#777"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={handleFetch}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Get Preview</Text>
          )}
        </TouchableOpacity>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {preview && (
          <View style={styles.previewCard}>
            {!!preview.thumbnail && (
              <Image
                source={{ uri: preview.thumbnail }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            )}
            <Text style={styles.title} numberOfLines={2}>
              {preview.title}
            </Text>
            {!!preview.author && <Text style={styles.author}>by {preview.author}</Text>}

            <TouchableOpacity
              style={[styles.button, styles.downloadButton]}
              onPress={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Text style={styles.buttonText}>{Math.round(progress * 100)}%</Text>
              ) : (
                <Text style={styles.buttonText}>Download to Gallery</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 60, backgroundColor: '#0f0f0f' },
  header: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 18 },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    padding: 14,
    borderRadius: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  button: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  error: { color: '#f87171', marginTop: 12 },
  previewCard: {
    marginTop: 20,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 14,
  },
  thumbnail: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#333',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  author: { color: '#9ca3af', fontSize: 13, marginTop: 4, marginBottom: 12 },
  downloadButton: { backgroundColor: '#16a34a', marginTop: 10 },
});
