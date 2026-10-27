package com.brnsic.app;

import android.content.Context;
import android.util.AttributeSet;
import android.view.View;
import android.webkit.WebView;

public class BackgroundWebView extends WebView {
    public BackgroundWebView(Context context) {
        super(context);
    }

    public BackgroundWebView(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    public BackgroundWebView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
        // Prevent Android from notifying Chromium that the window is GONE
        // This keeps audio and video decoding active when screen is off or app is minimized
        super.onWindowVisibilityChanged(View.VISIBLE);
    }

    @Override
    public void onPause() {
        // Suppress default onPause to keep background media playback alive
    }
}
