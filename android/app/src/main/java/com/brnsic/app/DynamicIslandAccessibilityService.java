package com.brnsic.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Context;
import android.content.Intent;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;

/**
 * AccessibilityService solely used to host TYPE_ACCESSIBILITY_OVERLAY
 * so DynamicIslandOverlay can render above the status bar & system layers
 * and remain touch-responsive without reading screen content.
 */
public class DynamicIslandAccessibilityService extends AccessibilityService {

    private static volatile DynamicIslandAccessibilityService instance;

    public static DynamicIslandAccessibilityService getInstance() {
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
        // Not used; canRetrieveWindowContent is false.
    }

    @Override
    public void onInterrupt() {
        // No-op
    }

    @Override
    public boolean onUnbind(Intent intent) {
        if (instance == this) {
            instance = null;
        }
        BackgroundAudioService.reattachDynamicIsland();
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        if (instance == this) {
            instance = null;
        }
        super.onDestroy();
    }
}
