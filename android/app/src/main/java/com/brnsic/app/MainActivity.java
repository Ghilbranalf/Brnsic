package com.brnsic.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
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
        public void playAudio(String audioUrl, String title, String artist, int positionMs) {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_PLAY);
                intent.putExtra(BackgroundAudioService.EXTRA_URL, audioUrl);
                intent.putExtra(BackgroundAudioService.EXTRA_TITLE, title);
                intent.putExtra(BackgroundAudioService.EXTRA_ARTIST, artist);
                intent.putExtra(BackgroundAudioService.EXTRA_POSITION, positionMs);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent);
                } else {
                    startService(intent);
                }
            } catch (Exception ignored) {}
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
        public void startPlayback(String title, String artist) {
            playAudio("", title, artist, 0);
        }

        @JavascriptInterface
        public void stopPlayback() {
            stopAudio();
        }

        @JavascriptInterface
        public void requestBatteryOptimizationExemption() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    PowerManager pm = (PowerManager) getSystemService(POWER_SERVICE);
                    if (pm != null && !pm.isIgnoringBatteryOptimizations(getPackageName())) {
                        Intent batteryIntent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        batteryIntent.setData(android.net.Uri.parse("package:" + getPackageName()));
                        startActivity(batteryIntent);
                    }
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                if (checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{android.Manifest.permission.POST_NOTIFICATIONS}, 101);
                }
            }

            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Brnsic:BackgroundAudioWakeLock");
                wakeLock.setReferenceCounted(false);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    try {
                        if (!powerManager.isIgnoringBatteryOptimizations(getPackageName())) {
                            Intent batteryIntent = new Intent(android.provider.Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                            batteryIntent.setData(android.net.Uri.parse("package:" + getPackageName()));
                            startActivity(batteryIntent);
                        }
                    } catch (Exception ignored) {}
                }
            }

            if (bridge != null && bridge.getWebView() != null) {
                WebView webView = bridge.getWebView();
                WebSettings webSettings = webView.getSettings();
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
