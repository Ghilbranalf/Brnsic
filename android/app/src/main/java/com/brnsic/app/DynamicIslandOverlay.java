package com.brnsic.app;

import android.animation.ValueAnimator;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;

public class DynamicIslandOverlay {

    private final Context context;
    private final WindowManager windowManager;
    private View overlayView;
    private ImageView coverImageView;
    private WaveformView waveformView;
    private ImageView playPauseImageView;
    private ImageView nextImageView;
    private WindowManager.LayoutParams layoutParams;

    private boolean isAdded = false;
    private boolean isPlaying = false;
    private Bitmap currentCover = null;

    // Drag tracking
    private int initialX;
    private int initialY;
    private float initialTouchX;
    private float initialTouchY;

    public DynamicIslandOverlay(Context context) {
        this.context = context;
        this.windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
    }

    public static boolean canDrawOverlay(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true;
    }

    public void show() {
        if (!canDrawOverlay(context)) return;
        if (isAdded) return;

        try {
            if (overlayView == null) {
                createOverlayView();
            }

            int layoutType;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                layoutType = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY;
            } else {
                layoutType = WindowManager.LayoutParams.TYPE_PHONE;
            }

            layoutParams = new WindowManager.LayoutParams(
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutType,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                            | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                            | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                    PixelFormat.TRANSLUCENT
            );

            layoutParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            layoutParams.x = 0;
            layoutParams.y = dpToPx(12);

            windowManager.addView(overlayView, layoutParams);
            isAdded = true;

            if (waveformView != null) {
                waveformView.setPlaying(isPlaying);
            }
        } catch (Exception ignored) {}
    }

    public void hide() {
        if (!isAdded || overlayView == null) return;
        try {
            if (waveformView != null) {
                waveformView.setPlaying(false);
            }
            windowManager.removeView(overlayView);
            isAdded = false;
        } catch (Exception ignored) {}
    }

    public void update(Bitmap cover, boolean playing) {
        this.isPlaying = playing;
        this.currentCover = cover;

        if (coverImageView != null && cover != null) {
            coverImageView.setImageBitmap(cover);
        }

        if (playPauseImageView != null) {
            playPauseImageView.setImageResource(playing ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
        }

        if (waveformView != null) {
            waveformView.setPlaying(playing);
        }
    }

    private void createOverlayView() {
        LinearLayout rootPill = new LinearLayout(context);
        rootPill.setOrientation(LinearLayout.HORIZONTAL);
        rootPill.setGravity(Gravity.CENTER_VERTICAL);

        int padHoriz = dpToPx(8);
        int padVert = dpToPx(4);
        rootPill.setPadding(padHoriz, padVert, padHoriz, padVert);

        // Black Capsule Pill Background (Matching Image 1)
        GradientDrawable pillBg = new GradientDrawable();
        pillBg.setColor(Color.BLACK);
        pillBg.setCornerRadius(dpToPx(20));
        pillBg.setStroke(dpToPx(1), Color.parseColor("#33FFFFFF"));
        rootPill.setBackground(pillBg);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            rootPill.setElevation(dpToPx(8));
        }

        // 1. Cover Art (Left)
        int coverSize = dpToPx(28);
        coverImageView = new ImageView(context);
        LinearLayout.LayoutParams coverParams = new LinearLayout.LayoutParams(coverSize, coverSize);
        coverParams.rightMargin = dpToPx(8);
        coverImageView.setLayoutParams(coverParams);
        coverImageView.setScaleType(ImageView.ScaleType.CENTER_CROP);

        GradientDrawable coverBg = new GradientDrawable();
        coverBg.setColor(Color.parseColor("#222222"));
        coverBg.setCornerRadius(dpToPx(6));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            coverImageView.setClipToOutline(true);
        }
        coverImageView.setBackground(coverBg);

        if (currentCover != null) {
            coverImageView.setImageBitmap(currentCover);
        } else {
            coverImageView.setImageResource(R.mipmap.ic_launcher_round);
        }
        rootPill.addView(coverImageView);

        // 2. Animated Waveform Bars (Center)
        int waveWidth = dpToPx(46);
        int waveHeight = dpToPx(18);
        waveformView = new WaveformView(context);
        LinearLayout.LayoutParams waveParams = new LinearLayout.LayoutParams(waveWidth, waveHeight);
        waveParams.rightMargin = dpToPx(10);
        waveformView.setLayoutParams(waveParams);
        waveformView.setPlaying(isPlaying);
        rootPill.addView(waveformView);

        // 3. Play / Pause Button
        int btnSize = dpToPx(24);
        playPauseImageView = new ImageView(context);
        LinearLayout.LayoutParams playParams = new LinearLayout.LayoutParams(btnSize, btnSize);
        playParams.rightMargin = dpToPx(6);
        playPauseImageView.setLayoutParams(playParams);
        playPauseImageView.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        playPauseImageView.setImageResource(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
        playPauseImageView.setColorFilter(Color.WHITE);
        playPauseImageView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent toggleIntent = new Intent(context, BackgroundAudioService.class);
                toggleIntent.setAction(isPlaying ? BackgroundAudioService.ACTION_PAUSE : BackgroundAudioService.ACTION_RESUME);
                context.startService(toggleIntent);
            }
        });
        rootPill.addView(playPauseImageView);

        // 4. Next Button
        nextImageView = new ImageView(context);
        LinearLayout.LayoutParams nextParams = new LinearLayout.LayoutParams(btnSize, btnSize);
        nextImageView.setLayoutParams(nextParams);
        nextImageView.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        nextImageView.setImageResource(android.R.drawable.ic_media_next);
        nextImageView.setColorFilter(Color.WHITE);
        nextImageView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent nextIntent = new Intent(context, BackgroundAudioService.class);
                nextIntent.setAction(BackgroundAudioService.ACTION_NEXT);
                context.startService(nextIntent);
            }
        });
        rootPill.addView(nextImageView);

        // Touch Listener: Drag to move & tap to open Brnsic
        rootPill.setOnTouchListener(new View.OnTouchListener() {
            private long touchStartTime;

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        touchStartTime = System.currentTimeMillis();
                        if (layoutParams != null) {
                            initialX = layoutParams.x;
                            initialY = layoutParams.y;
                        }
                        initialTouchX = event.getRawX();
                        initialTouchY = event.getRawY();
                        return true;

                    case MotionEvent.ACTION_MOVE:
                        if (layoutParams != null && isAdded) {
                            layoutParams.x = initialX + (int) (event.getRawX() - initialTouchX);
                            layoutParams.y = initialY + (int) (event.getRawY() - initialTouchY);
                            try {
                                windowManager.updateViewLayout(overlayView, layoutParams);
                            } catch (Exception ignored) {}
                        }
                        return true;

                    case MotionEvent.ACTION_UP:
                        long duration = System.currentTimeMillis() - touchStartTime;
                        float diffX = Math.abs(event.getRawX() - initialTouchX);
                        float diffY = Math.abs(event.getRawY() - initialTouchY);

                        if (duration < 250 && diffX < 10 && diffY < 10) {
                            // Tap on pill body -> Open app
                            openApp();
                        }
                        return true;
                }
                return false;
            }
        });

        overlayView = rootPill;
    }

    private void openApp() {
        try {
            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            context.startActivity(appIntent);
        } catch (Exception ignored) {}
    }

    private int dpToPx(int dp) {
        return (int) TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP,
                dp,
                context.getResources().getDisplayMetrics()
        );
    }

    // --- Custom Waveform Visualizer View ---
    public static class WaveformView extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final float[] baseScale = new float[]{0.3f, 0.5f, 0.85f, 1.0f, 0.7f, 0.95f, 0.45f, 0.6f, 0.25f};
        private final float[] animHeights = new float[9];
        private ValueAnimator animator;
        private boolean playing = false;

        public WaveformView(Context context) {
            super(context);
            paint.setColor(Color.WHITE);
            paint.setStyle(Paint.Style.FILL);
            setupAnimation();
        }

        private void setupAnimation() {
            for (int i = 0; i < animHeights.length; i++) animHeights[i] = 0.25f;

            animator = ValueAnimator.ofFloat(0f, 1f);
            animator.setDuration(700);
            animator.setRepeatMode(ValueAnimator.REVERSE);
            animator.setRepeatCount(ValueAnimator.INFINITE);
            animator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
                @Override
                public void onAnimationUpdate(ValueAnimator animation) {
                    float val = (float) animation.getAnimatedValue();
                    for (int i = 0; i < animHeights.length; i++) {
                        double phase = (i * 0.8) + (val * Math.PI * 2);
                        float wave = (float) ((Math.sin(phase) + 1.0) / 2.0);
                        animHeights[i] = 0.2f + (baseScale[i] * 0.8f * wave);
                    }
                    invalidate();
                }
            });
        }

        public void setPlaying(boolean isPlaying) {
            this.playing = isPlaying;
            if (isPlaying) {
                if (!animator.isRunning()) animator.start();
            } else {
                animator.cancel();
                for (int i = 0; i < animHeights.length; i++) animHeights[i] = 0.25f;
                invalidate();
            }
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            int w = getWidth();
            int h = getHeight();
            if (w == 0 || h == 0) return;

            int count = animHeights.length;
            float barW = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 2.5f, getResources().getDisplayMetrics());
            float gap = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 2.2f, getResources().getDisplayMetrics());
            float totalW = (count * barW) + ((count - 1) * gap);
            float startX = (w - totalW) / 2f;

            for (int i = 0; i < count; i++) {
                float barH = Math.max(dpToPx(3), h * animHeights[i]);
                float left = startX + (i * (barW + gap));
                float top = (h - barH) / 2f;
                float right = left + barW;
                float bottom = top + barH;
                canvas.drawRoundRect(left, top, right, bottom, barW / 2f, barW / 2f, paint);
            }
        }

        private float dpToPx(float dp) {
            return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, getResources().getDisplayMetrics());
        }
    }
}
