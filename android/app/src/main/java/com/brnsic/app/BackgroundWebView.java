package com.brnsic.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import com.getcapacitor.CapacitorWebView;

public class BackgroundWebView extends CapacitorWebView {

    public BackgroundWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        // ALWAYS pass View.VISIBLE to prevent Chromium from pausing HTML5 media decoders
        // when the screen is locked or the user leaves the application.
        super.onWindowVisibilityChanged(View.VISIBLE);
    }

    @Override
    protected void onVisibilityChanged(View changedView, int visibility) {
        super.onVisibilityChanged(changedView, View.VISIBLE);
    }

    @Override
    public void dispatchWindowVisibilityChanged(int visibility) {
        super.dispatchWindowVisibilityChanged(View.VISIBLE);
    }

    @Override
    public int getWindowVisibility() {
        return View.VISIBLE;
    }

    @Override
    public void onPause() {
        // Suppress onPause to keep audio decoding running continuously in background
    }

    @Override
    public void pauseTimers() {
        // Suppress pauseTimers so JavaScript audio loops and time polling remain active
    }
}
