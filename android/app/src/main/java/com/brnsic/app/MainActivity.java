package com.brnsic.app;

import android.os.Bundle;
import android.os.PowerManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            // Keep CPU alive for background audio playback when screen turns off
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
                // Immediately counteract bridge.onPause() so audio decoders stay alive in background
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
                // Keep webview running continuously when screen locks or app is minimized
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
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {}
    }
}
