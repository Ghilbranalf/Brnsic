package com.brnsic.app;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;
    private static MainActivity instance;

    public static void notifyTrackCompleted() {
        if (instance != null && instance.bridge != null && instance.bridge.getWebView() != null) {
            instance.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    instance.bridge.getWebView().evaluateJavascript(
                        "(function(){ if (window.__handleNativeTrackCompleted) { window.__handleNativeTrackCompleted(); } })();",
                        null
                    );
                }
            });
        }
    }

    public static void notifyNextTrack() {
        if (instance != null && instance.bridge != null && instance.bridge.getWebView() != null) {
            instance.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    instance.bridge.getWebView().evaluateJavascript(
                        "(function(){ if (window.__handleNativeNext) { window.__handleNativeNext(); } else if (window.__handleNativeTrackCompleted) { window.__handleNativeTrackCompleted(); } })();",
                        null
                    );
                }
            });
        }
    }

    public static void notifyPrevTrack() {
        if (instance != null && instance.bridge != null && instance.bridge.getWebView() != null) {
            instance.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    instance.bridge.getWebView().evaluateJavascript(
                        "(function(){ if (window.__handleNativePrev) { window.__handleNativePrev(); } })();",
                        null
                    );
                }
            });
        }
    }

    public static void notifyPlaybackState(boolean isPlaying) {
        if (instance != null && instance.bridge != null && instance.bridge.getWebView() != null) {
            instance.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    instance.bridge.getWebView().evaluateJavascript(
                        "(function(){ if (window.__handleNativePlaybackState) { window.__handleNativePlaybackState(" + isPlaying + "); } })();",
                        null
                    );
                }
            });
        }
    }

    public static void notifySeekTo(int positionSeconds) {
        if (instance != null && instance.bridge != null && instance.bridge.getWebView() != null) {
            instance.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    instance.bridge.getWebView().evaluateJavascript(
                        "(function(){ if (window.__handleNativeSeekTo) { window.__handleNativeSeekTo(" + positionSeconds + "); } })();",
                        null
                    );
                }
            });
        }
    }

    public static void notifyLikeTrack() {
        if (instance != null && instance.bridge != null && instance.bridge.getWebView() != null) {
            instance.bridge.getWebView().post(new Runnable() {
                @Override
                public void run() {
                    instance.bridge.getWebView().evaluateJavascript(
                        "(function(){ if (window.__handleNativeLike) { window.__handleNativeLike(); } })();",
                        null
                    );
                }
            });
        }
    }

    public class NativeAudioBridge {
        @JavascriptInterface
        public void playAudioWithDuration(String audioUrl, String title, String artist, int positionMs, String coverUrl, int durationMs) {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_PLAY);
                intent.putExtra(BackgroundAudioService.EXTRA_URL, audioUrl);
                intent.putExtra(BackgroundAudioService.EXTRA_TITLE, title);
                intent.putExtra(BackgroundAudioService.EXTRA_ARTIST, artist);
                intent.putExtra(BackgroundAudioService.EXTRA_POSITION, positionMs);
                intent.putExtra(BackgroundAudioService.EXTRA_COVER, coverUrl);
                intent.putExtra(BackgroundAudioService.EXTRA_DURATION, durationMs);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent);
                } else {
                    startService(intent);
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void playAudio(String audioUrl, String title, String artist, int positionMs, String coverUrl) {
            playAudioWithDuration(audioUrl, title, artist, positionMs, coverUrl, 0);
        }

        @JavascriptInterface
        public void updateNativePlaybackState(boolean isPlaying, int positionMs, int durationMs) {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_UPDATE_STATE);
                intent.putExtra(BackgroundAudioService.EXTRA_IS_PLAYING, isPlaying);
                intent.putExtra(BackgroundAudioService.EXTRA_POSITION, positionMs);
                intent.putExtra(BackgroundAudioService.EXTRA_DURATION, durationMs);
                startService(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void playAudio(String audioUrl, String title, String artist, int positionMs) {
            playAudio(audioUrl, title, artist, positionMs, "");
        }

        @JavascriptInterface
        public void pauseAudio() {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_PAUSE);
                startService(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void resumeAudio() {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_RESUME);
                startService(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void seekAudio(int positionMs) {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_SEEK);
                intent.putExtra(BackgroundAudioService.EXTRA_POSITION, positionMs);
                startService(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void setVolume(float volume) {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_VOLUME);
                intent.putExtra(BackgroundAudioService.EXTRA_VOLUME, volume);
                startService(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void stopAudio() {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_STOP);
                startService(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void startPlayback(String title, String artist, String cover) {
            playAudio("", title, artist, 0, cover);
        }

        @JavascriptInterface
        public void startPlayback(String title, String artist) {
            playAudio("", title, artist, 0, "");
        }

        @JavascriptInterface
        public void stopPlayback() {
            pauseAudio();
        }

        @JavascriptInterface
        public String getAppVersion() {
            return "3.8.0";
        }

        @JavascriptInterface
        public int getAppVersionCode() {
            return 7;
        }

        @JavascriptInterface
        public void requestBatteryOptimizationExemption() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    promptBatteryOptimization();
                }
            });
        }

        @JavascriptInterface
        public void requestPermissions() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    requestBackgroundAndNotificationPermissions();
                }
            });
        }

        @JavascriptInterface
        public boolean isPermissionGranted() {
            boolean notifGranted = true;
            if (Build.VERSION.SDK_INT >= 33) {
                notifGranted = checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == android.content.pm.PackageManager.PERMISSION_GRANTED;
            }
            boolean batteryGranted = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
                if (pm != null) {
                    batteryGranted = pm.isIgnoringBatteryOptimizations(getPackageName());
                }
            }
            return notifGranted && batteryGranted;
        }

        @JavascriptInterface
        public void openAppSettings() {
            try {
                Intent intent = new Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.parse("package:" + getPackageName()));
                startActivity(intent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void openExternalAuth(String authUrl) {
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(authUrl));
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                MainActivity.this.startActivity(browserIntent);
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void downloadAndInstallUpdate(final String urlString) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    startApkDownload(urlString);
                }
            });
        }

        @JavascriptInterface
        public boolean isOverlayPermissionGranted() {
            return DynamicIslandOverlay.canDrawOverlay(MainActivity.this);
        }

        @JavascriptInterface
        public void restoreDynamicIsland() {
            BackgroundAudioService.restoreDynamicIsland();
        }

        @JavascriptInterface
        public void setDynamicIslandEnabled(boolean enabled) {
            BackgroundAudioService.setDynamicIslandEnabled(enabled);
        }

        @JavascriptInterface
        public boolean isDynamicIslandEnabled() {
            android.content.SharedPreferences prefs = getSharedPreferences("brnsic_overlay_prefs", Context.MODE_PRIVATE);
            return prefs.getBoolean("overlay_enabled", true);
        }

        @JavascriptInterface
        public void setDynamicIslandPosition(String position, int offsetY) {
            BackgroundAudioService.setDynamicIslandPosition(position, offsetY);
        }

        @JavascriptInterface
        public String getDynamicIslandPosition() {
            android.content.SharedPreferences prefs = getSharedPreferences("brnsic_overlay_prefs", Context.MODE_PRIVATE);
            return prefs.getString("overlay_position", "center");
        }

        @JavascriptInterface
        public void requestOverlayPermission() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    if (!android.provider.Settings.canDrawOverlays(MainActivity.this)) {
                        Intent intent = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                android.net.Uri.parse("package:" + getPackageName()));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                    }
                } catch (Exception ignored) {}
            }
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }

    public void startApkDownload(String urlString) {
        try {
            String fullUrl = urlString;
            if (fullUrl == null || fullUrl.isEmpty()) {
                fullUrl = "https://brnsic.vercel.app/Brnsic.apk";
            } else if (!fullUrl.startsWith("http")) {
                fullUrl = "https://brnsic.vercel.app" + (urlString.startsWith("/") ? urlString : "/" + urlString);
            }

            // 1. Android System DownloadManager
            try {
                android.app.DownloadManager.Request request = new android.app.DownloadManager.Request(android.net.Uri.parse(fullUrl));
                request.setTitle("Pembaruan Brnsic APK");
                request.setDescription("Mengunduh Brnsic.apk versi terbaru...");
                request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
                request.setMimeType("application/vnd.android.package-archive");
                request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, "Brnsic.apk");

                android.app.DownloadManager downloadManager = (android.app.DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
                if (downloadManager != null) {
                    downloadManager.enqueue(request);
                    android.widget.Toast.makeText(this, "Mengunduh pembaruan Brnsic.apk... Cek notifikasi Anda", android.widget.Toast.LENGTH_LONG).show();
                }
            } catch (Exception ignored) {}

            // 2. Open directly in external browser as instant fallback
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse(fullUrl));
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(browserIntent);
            } catch (Exception ignored) {}

        } catch (Exception e) {
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, android.net.Uri.parse("https://brnsic.vercel.app/Brnsic.apk"));
                browserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(browserIntent);
            } catch (Exception ignored) {}
        }
    }

    public void requestBackgroundAndNotificationPermissions() {
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
                    return;
                }
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                if (!android.provider.Settings.canDrawOverlays(this)) {
                    try {
                        Intent overlayIntent = new Intent(android.provider.Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                                android.net.Uri.parse("package:" + getPackageName()));
                        overlayIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(overlayIntent);
                    } catch (Exception ignored) {}
                }
            }
            promptBatteryOptimization();
        } catch (Exception ignored) {}
    }

    public void promptBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
                if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                    Intent batteryIntent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    batteryIntent.setData(android.net.Uri.parse("package:" + getPackageName()));
                    startActivity(batteryIntent);
                }
            } catch (Exception e) {
                try {
                    Intent fallback = new Intent(android.provider.Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    startActivity(fallback);
                } catch (Exception ignored) {}
            }
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        try {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Brnsic:BackgroundAudioWakeLock");
                wakeLock.setReferenceCounted(false);
            }

            if (bridge != null && bridge.getWebView() != null) {
                WebView webView = bridge.getWebView();

                // Hardware GPU acceleration and buttery smooth 120fps scrolling
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                webView.setVerticalScrollBarEnabled(false);
                webView.setHorizontalScrollBarEnabled(false);
                webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

                WebSettings webSettings = webView.getSettings();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    webSettings.setOffscreenPreRaster(true);
                }
                webSettings.setMediaPlaybackRequiresUserGesture(false);
                webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
                webSettings.setDomStorageEnabled(true);
                webSettings.setDatabaseEnabled(true);
                webSettings.setJavaScriptEnabled(true);
                webSettings.setAllowFileAccess(true);
                webSettings.setAllowContentAccess(true);

                // Add BrnsicNative identifier into user agent for detection
                String currentUa = webSettings.getUserAgentString();
                if (currentUa != null && !currentUa.contains("BrnsicNative")) {
                    webSettings.setUserAgentString(currentUa + " BrnsicNative/1.0 BrnsicMobile/1.0");
                }
                webView.addJavascriptInterface(new NativeAudioBridge(), "BrnsicNative");

                // DownloadListener so APK downloads trigger seamlessly
                webView.setDownloadListener(new android.webkit.DownloadListener() {
                    @Override
                    public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimeType, long contentLength) {
                        startApkDownload(url);
                    }
                });
            }
            getOnBackPressedDispatcher().addCallback(this, new androidx.activity.OnBackPressedCallback(true) {
                @Override
                public void handleOnBackPressed() {
                    handleBackNavigation();
                }
            });

            handleDeepLink(getIntent());
        } catch (Exception ignored) {}
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        handleDeepLink(intent);
    }

    private void handleDeepLink(Intent intent) {
        try {
            if (intent != null && intent.getData() != null) {
                android.net.Uri uri = intent.getData();
                if ("brnsic".equals(uri.getScheme())) {
                    final String token = uri.getQueryParameter("token");
                    final String user = uri.getQueryParameter("user");
                    if (token != null && !token.isEmpty() && bridge != null && bridge.getWebView() != null) {
                        bridge.getWebView().post(new Runnable() {
                            @Override
                            public void run() {
                                String userParam = user != null ? "'" + user.replace("'", "\\'") + "'" : "null";
                                String script = "(function(){ " +
                                    "try { localStorage.setItem('brnsic_auth_token', '" + token + "'); } catch(e){} " +
                                    (user != null ? "try { localStorage.setItem('brnsic_user_profile', decodeURIComponent('" + user.replace("'", "\\'") + "')); } catch(e){} " : "") +
                                    "if (window.__handleNativeAuthToken) { window.__handleNativeAuthToken('" + token + "', " + userParam + "); } else { window.location.replace('/?login_success=true&token=" + token + "'); } " +
                                    "})();";
                                bridge.getWebView().evaluateJavascript(script, null);
                                bridge.getWebView().clearHistory();
                            }
                        });
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void handleBackNavigation() {
        if (bridge != null && bridge.getWebView() != null) {
            WebView webView = bridge.getWebView();
            webView.evaluateJavascript(
                "(function(){ if (window.__handleNativeBack && window.__handleNativeBack()) { return 'handled'; } return 'unhandled'; })()",
                new android.webkit.ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (value == null || !value.contains("handled") || value.contains("unhandled")) {
                            // If web did not consume back press (e.g. user is on home screen), minimize to background like Spotify
                            moveTaskToBack(true);
                        }
                    }
                }
            );
            return;
        }
        moveTaskToBack(true);
    }

    @Override
    public void onBackPressed() {
        handleBackNavigation();
    }

    @Override
    public void onResume() {
        super.onResume();
        BackgroundAudioService.setAppForegroundState(true);
        try {
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().onResume();
                bridge.getWebView().resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onPause() {
        super.onPause();
        BackgroundAudioService.setAppForegroundState(false);
        try {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(180 * 60 * 1000L); // 3 hours max wake lock while playing
            }
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().onResume();
                bridge.getWebView().resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onStop() {
        super.onStop();
        BackgroundAudioService.setAppForegroundState(false);
        try {
            if (wakeLock != null && !wakeLock.isHeld()) {
                wakeLock.acquire(180 * 60 * 1000L);
            }
            if (bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().onResume();
                bridge.getWebView().resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        try {
            if (!hasFocus && bridge != null && bridge.getWebView() != null) {
                bridge.getWebView().resumeTimers();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            Intent intent = new Intent(this, BackgroundAudioService.class);
            intent.setAction(BackgroundAudioService.ACTION_STOP);
            startService(intent);

            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {}
    }
}
