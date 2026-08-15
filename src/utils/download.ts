import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

export async function downloadToGallery(
  downloadUrl: string,
  filenamePrefix: string,
  onProgress?: (fraction: number) => void,
): Promise<MediaLibrary.Asset> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error(
      "Storage/photos permission was denied, so the video cannot be saved.",
    );
  }

  const fileUri = `${FileSystem.documentDirectory}${filenamePrefix}_${Date.now()}.mp4`;

  const downloadResumable = FileSystem.createDownloadResumable(
    downloadUrl,
    fileUri,
    {},
    (progress) => {
      if (onProgress && progress.totalBytesExpectedToWrite > 0) {
        onProgress(
          progress.totalBytesWritten / progress.totalBytesExpectedToWrite,
        );
      }
    },
  );

  const result = await downloadResumable.downloadAsync();
  if (!result) {
    throw new Error("Download did not complete.");
  }

  const asset = await MediaLibrary.createAssetAsync(result.uri);
  const album = await MediaLibrary.getAlbumAsync("TripleDownloader");
  if (album == null) {
    await MediaLibrary.createAlbumAsync("TripleDownloader", asset, false);
  } else {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }

  return asset;
}
