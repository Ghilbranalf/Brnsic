package com.brnsic.app;

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

    public class NativeAudioBridge {
        @JavascriptInterface
        public void playAudio(String audioUrl, String title, String artist, int positionMs, String coverUrl) {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_PLAY);
                intent.putExtra(BackgroundAudioService.EXTRA_URL, audioUrl);
                intent.putExtra(BackgroundAudioService.EXTRA_TITLE, title);
                intent.putExtra(BackgroundAudioService.EXTRA_ARTIST, artist);
                intent.putExtra(BackgroundAudioService.EXTRA_POSITION, positionMs);
                intent.putExtra(BackgroundAudioService.EXTRA_COVER, coverUrl);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent);
                } else {
                    startService(intent);
                }
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
            stopAudio();
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
        public boolean isNativeApp() {
            return true;
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
            }
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
                    String token = uri.getQueryParameter("token");
                    if (token != null && !token.isEmpty() && bridge != null && bridge.getWebView() != null) {
                        bridge.getWebView().post(new Runnable() {
                            @Override
                            public void run() {
                                bridge.getWebView().evaluateJavascript(
                                    "(function(){ if (window.__handleNativeAuthToken) { window.__handleNativeAuthToken('" + token + "'); } else { localStorage.setItem('brnsic_auth_token', '" + token + "'); window.location.href = '/?login_success=true&token=" + token + "'; } })();",
                                    null
                                );
                            }
                        });
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onResume() {
        super.onResume();
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
