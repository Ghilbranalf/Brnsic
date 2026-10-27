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

    public class NativeAudioBridge {
        @JavascriptInterface
        public void startPlayback(String title, String artist) {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_START);
                intent.putExtra(BackgroundAudioService.EXTRA_TITLE, title);
                intent.putExtra(BackgroundAudioService.EXTRA_ARTIST, artist);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    startForegroundService(intent);
                } else {
                    startService(intent);
                }
            } catch (Exception ignored) {}
        }

        @JavascriptInterface
        public void stopPlayback() {
            try {
                Intent intent = new Intent(MainActivity.this, BackgroundAudioService.class);
                intent.setAction(BackgroundAudioService.ACTION_STOP);
                startService(intent);
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
        try {
            PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
            if (powerManager != null) {
                wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "Brnsic:BackgroundAudioWakeLock");
                wakeLock.setReferenceCounted(false);
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
