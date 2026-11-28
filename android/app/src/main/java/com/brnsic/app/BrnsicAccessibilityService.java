package com.brnsic.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;

public class BrnsicAccessibilityService extends AccessibilityService {
    private static volatile BrnsicAccessibilityService instance;

    public static BrnsicAccessibilityService getInstance() {
        return instance;
    }

    public static boolean isRunning() {
        return instance != null;
    }

    public WindowManager getOverlayWindowManager() {
        return (WindowManager) getSystemService(Context.WINDOW_SERVICE);
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
        BackgroundAudioService.reattachDynamicIsland();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // Intentionally no-op: zero CPU overhead, zero frame drops.
    }

    @Override
    public void onInterrupt() {
        // No-op
    }

    @Override
    public boolean onUnbind(Intent intent) {
        instance = null;
        BackgroundAudioService.reattachDynamicIsland();
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }
}
