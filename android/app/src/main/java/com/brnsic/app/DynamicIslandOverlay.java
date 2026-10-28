package com.brnsic.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.SeekBar;
import android.widget.TextView;

public class DynamicIslandOverlay {

    private final Context context;
    private final WindowManager windowManager;
    private final SharedPreferences prefs;

    private FrameLayout containerView;
    private LinearLayout collapsedPill;
    private LinearLayout expandedCard;

    // Collapsed components (Minimal, Apple-style: Cover + Live Dancing Waveform)
    private ImageView collapsedCover;
    private WaveformView collapsedWave;

    // Expanded components
    private ImageView expandedCover;
    private TextView expandedTitle;
    private TextView expandedArtist;
    private WaveformView expandedWave;
    private ImageView expandedCloseBtn;
    private SeekBar expandedSeekBar;
    private TextView expandedTimeCurrent;
    private TextView expandedTimeDuration;
    private ImageView expandedPrev;
    private ImageView expandedPlayPause;
    private ImageView expandedNext;

    private WindowManager.LayoutParams layoutParams;

    private boolean isAdded = false;
    private boolean isExpanded = false;
    private boolean isPlaying = false;
    private boolean isUserSeeking = false;
    private boolean isDismissed = false;

    private Bitmap currentCover = null;
    private String currentTitle = "Brnsic Music";
    private String currentArtist = "Memutar di latar belakang";
    private long currentPositionMs = 0;
    private long currentDurationMs = 210000;

    private final Handler progressHandler = new Handler(Looper.getMainLooper());
    private final Runnable progressUpdater = new Runnable() {
        @Override
        public void run() {
            if (isPlaying && isExpanded && !isUserSeeking) {
                currentPositionMs += 1000;
                if (currentPositionMs > currentDurationMs) currentPositionMs = currentDurationMs;
                updateProgressUI();
            }
            if (isPlaying && isExpanded) {
                progressHandler.postDelayed(this, 1000);
            }
        }
    };

    public DynamicIslandOverlay(Context context) {
        this.context = context;
        this.windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        this.prefs = context.getSharedPreferences("brnsic_overlay_prefs", Context.MODE_PRIVATE);
    }

    public static boolean canDrawOverlay(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(context);
        }
        return true;
    }

    public void show() {
        if (!canDrawOverlay(context)) return;
        boolean isEnabled = prefs.getBoolean("overlay_enabled", true);
        if (!isEnabled) return;
        if (isDismissed) return;
        if (isAdded) return;

        try {
            if (containerView == null) {
                buildViews();
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

            applyPositionConfigInternal();

            windowManager.addView(containerView, layoutParams);
            isAdded = true;

            applyDataToViews();
        } catch (Exception ignored) {}
    }

    private void applyPositionConfigInternal() {
        if (layoutParams == null) return;

        int statusBarHeight = dpToPx(32);
        int resId = context.getResources().getIdentifier("status_bar_height", "dimen", "android");
        if (resId > 0) {
            statusBarHeight = context.getResources().getDimensionPixelSize(resId);
        }

        String position = prefs.getString("overlay_position", "center");
        int offsetYExtra = prefs.getInt("overlay_offset_y", 0);

        // Safe clearance below status bar and punch-hole camera (10dp padding below status bar)
        int safeTopY = statusBarHeight + dpToPx(10) + offsetYExtra;

        if ("left".equals(position)) {
            layoutParams.gravity = Gravity.TOP | Gravity.START;
            layoutParams.x = dpToPx(16);
        } else if ("right".equals(position)) {
            layoutParams.gravity = Gravity.TOP | Gravity.END;
            layoutParams.x = dpToPx(16);
        } else {
            layoutParams.gravity = Gravity.TOP | Gravity.CENTER_HORIZONTAL;
            layoutParams.x = 0;
        }
        layoutParams.y = safeTopY;
    }

    public void applyPositionConfig() {
        if (layoutParams == null || containerView == null || !isAdded) return;
        try {
            applyPositionConfigInternal();
            windowManager.updateViewLayout(containerView, layoutParams);
        } catch (Exception ignored) {}
    }

    public void hide() {
        if (!isAdded || containerView == null) return;
        try {
            progressHandler.removeCallbacks(progressUpdater);
            if (collapsedWave != null) collapsedWave.setPlaying(false);
            if (expandedWave != null) expandedWave.setPlaying(false);
            windowManager.removeView(containerView);
            isAdded = false;
        } catch (Exception ignored) {}
    }

    public void dismiss() {
        this.isDismissed = true;
        hide();
    }

    public void resetDismissed() {
        this.isDismissed = false;
    }

    public boolean isDismissed() {
        return this.isDismissed;
    }

    public void update(Bitmap cover, String title, String artist, boolean playing, long positionMs, long durationMs) {
        if (title != null && !title.equals(this.currentTitle)) {
            // Auto restore when new song plays so user always gets the pill
            this.isDismissed = false;
        }

        this.currentCover = cover;
        if (title != null && !title.trim().isEmpty()) this.currentTitle = title;
        if (artist != null && !artist.trim().isEmpty()) this.currentArtist = artist;
        this.isPlaying = playing;
        if (positionMs >= 0) this.currentPositionMs = positionMs;
        if (durationMs > 0) this.currentDurationMs = durationMs;

        applyDataToViews();

        if (isPlaying && isExpanded) {
            progressHandler.removeCallbacks(progressUpdater);
            progressHandler.post(progressUpdater);
        } else {
            progressHandler.removeCallbacks(progressUpdater);
        }
    }

    public void setExpanded(boolean expanded) {
        if (this.isExpanded == expanded) return;
        this.isExpanded = expanded;

        if (collapsedPill != null) {
            collapsedPill.setVisibility(expanded ? View.GONE : View.VISIBLE);
        }
        if (expandedCard != null) {
            expandedCard.setVisibility(expanded ? View.VISIBLE : View.GONE);
        }

        applyDataToViews();

        if (isAdded && layoutParams != null) {
            try {
                windowManager.updateViewLayout(containerView, layoutParams);
            } catch (Exception ignored) {}
        }

        if (expanded && isPlaying) {
            progressHandler.removeCallbacks(progressUpdater);
            progressHandler.post(progressUpdater);
        } else {
            progressHandler.removeCallbacks(progressUpdater);
        }
    }

    private void applyDataToViews() {
        // Collapsed UI
        if (collapsedCover != null && currentCover != null) {
            collapsedCover.setImageBitmap(currentCover);
        }
        if (collapsedWave != null) {
            collapsedWave.setPlaying(isPlaying);
        }

        // Expanded UI (Full Luxury Card)
        if (expandedCover != null && currentCover != null) {
            expandedCover.setImageBitmap(currentCover);
        }
        if (expandedTitle != null) {
            expandedTitle.setText(currentTitle);
        }
        if (expandedArtist != null) {
            expandedArtist.setText(currentArtist);
        }
        if (expandedPlayPause != null) {
            expandedPlayPause.setImageResource(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
        }
        if (expandedWave != null) {
            expandedWave.setPlaying(isPlaying);
        }

        updateProgressUI();
    }

    private void updateProgressUI() {
        if (isUserSeeking) return;
        if (expandedSeekBar != null && currentDurationMs > 0) {
            int progress = (int) ((currentPositionMs * 1000) / currentDurationMs);
            expandedSeekBar.setProgress(Math.max(0, Math.min(1000, progress)));
        }
        if (expandedTimeCurrent != null) {
            expandedTimeCurrent.setText(formatTime(currentPositionMs / 1000));
        }
        if (expandedTimeDuration != null) {
            expandedTimeDuration.setText(formatTime(currentDurationMs / 1000));
        }
    }

    private String formatTime(long seconds) {
        long m = seconds / 60;
        long s = seconds % 60;
        return String.format("%02d:%02d", m, s);
    }

    private void buildViews() {
        containerView = new FrameLayout(context);

        // 1. COLLAPSED PILL (Minimal Apple style: Cover + Live Dancing Waveform)
        collapsedPill = buildCollapsedPill();
        collapsedPill.setVisibility(isExpanded ? View.GONE : View.VISIBLE);
        containerView.addView(collapsedPill);

        // 2. EXPANDED LUXURY CARD (Full controls, seekbar, close button)
        expandedCard = buildExpandedCard();
        expandedCard.setVisibility(isExpanded ? View.VISIBLE : View.GONE);
        containerView.addView(expandedCard);
    }

    private LinearLayout buildCollapsedPill() {
        LinearLayout pill = new LinearLayout(context);
        pill.setOrientation(LinearLayout.HORIZONTAL);
        pill.setGravity(Gravity.CENTER_VERTICAL);

        int padHoriz = dpToPx(10);
        int padVert = dpToPx(5);
        pill.setPadding(padHoriz, padVert, padHoriz, padVert);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.BLACK);
        bg.setCornerRadius(dpToPx(24));
        bg.setStroke(dpToPx(1), Color.parseColor("#33FFFFFF"));
        pill.setBackground(bg);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            pill.setElevation(dpToPx(12));
        }

        // Cover on Left
        int coverSize = dpToPx(28);
        collapsedCover = new ImageView(context);
        LinearLayout.LayoutParams coverParams = new LinearLayout.LayoutParams(coverSize, coverSize);
        coverParams.rightMargin = dpToPx(10);
        collapsedCover.setLayoutParams(coverParams);
        collapsedCover.setScaleType(ImageView.ScaleType.CENTER_CROP);
        GradientDrawable coverBg = new GradientDrawable();
        coverBg.setColor(Color.parseColor("#222222"));
        coverBg.setCornerRadius(dpToPx(8));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            collapsedCover.setClipToOutline(true);
        }
        collapsedCover.setBackground(coverBg);
        if (currentCover != null) collapsedCover.setImageBitmap(currentCover);
        pill.addView(collapsedCover);

        // Live Dancing Waveform on Right (Green Spotify Style)
        collapsedWave = new WaveformView(context, Color.parseColor("#1ed760"));
        LinearLayout.LayoutParams waveParams = new LinearLayout.LayoutParams(dpToPx(48), dpToPx(18));
        collapsedWave.setLayoutParams(waveParams);
        pill.addView(collapsedWave);

        // Tap on the pill expands to the full Luxury Card!
        // No dragging, no extra buttons, zero misclicks!
        pill.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setExpanded(true);
            }
        });

        return pill;
    }

    private LinearLayout buildExpandedCard() {
        LinearLayout card = new LinearLayout(context);
        card.setOrientation(LinearLayout.VERTICAL);
        card.setGravity(Gravity.CENTER_HORIZONTAL);

        int pad = dpToPx(16);
        card.setPadding(pad, pad, pad, pad);

        // Card width: 330dp
        LinearLayout.LayoutParams cardParams = new LinearLayout.LayoutParams(dpToPx(330), ViewGroup.LayoutParams.WRAP_CONTENT);
        card.setLayoutParams(cardParams);

        GradientDrawable bg = new GradientDrawable();
        bg.setColor(Color.BLACK);
        bg.setCornerRadius(dpToPx(28));
        bg.setStroke(dpToPx(1), Color.parseColor("#33FFFFFF"));
        card.setBackground(bg);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            card.setElevation(dpToPx(18));
        }

        // ROW 1: Top Row (Cover + Title/Artist + Orange Waveform + Close 'X' Button)
        LinearLayout topRow = new LinearLayout(context);
        topRow.setOrientation(LinearLayout.HORIZONTAL);
        topRow.setGravity(Gravity.CENTER_VERTICAL);
        topRow.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        // Album cover
        int coverSize = dpToPx(50);
        expandedCover = new ImageView(context);
        LinearLayout.LayoutParams coverParams = new LinearLayout.LayoutParams(coverSize, coverSize);
        coverParams.rightMargin = dpToPx(12);
        expandedCover.setLayoutParams(coverParams);
        expandedCover.setScaleType(ImageView.ScaleType.CENTER_CROP);
        GradientDrawable coverBg = new GradientDrawable();
        coverBg.setColor(Color.parseColor("#1f1f1f"));
        coverBg.setCornerRadius(dpToPx(10));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            expandedCover.setClipToOutline(true);
        }
        expandedCover.setBackground(coverBg);
        if (currentCover != null) expandedCover.setImageBitmap(currentCover);
        expandedCover.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                openApp();
            }
        });
        topRow.addView(expandedCover);

        // Title and Artist Column
        LinearLayout infoCol = new LinearLayout(context);
        infoCol.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams infoParams = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f);
        infoParams.rightMargin = dpToPx(8);
        infoCol.setLayoutParams(infoParams);
        infoCol.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                openApp();
            }
        });

        expandedTitle = new TextView(context);
        expandedTitle.setText(currentTitle);
        expandedTitle.setTextColor(Color.WHITE);
        expandedTitle.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        expandedTitle.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        expandedTitle.setSingleLine(true);
        expandedTitle.setEllipsize(android.text.TextUtils.TruncateAt.END);
        infoCol.addView(expandedTitle);

        expandedArtist = new TextView(context);
        expandedArtist.setText(currentArtist);
        expandedArtist.setTextColor(Color.parseColor("#b3b3b3"));
        expandedArtist.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        expandedArtist.setSingleLine(true);
        expandedArtist.setEllipsize(android.text.TextUtils.TruncateAt.END);
        expandedArtist.setPadding(0, dpToPx(2), 0, 0);
        infoCol.addView(expandedArtist);

        topRow.addView(infoCol);

        // Orange Waveform Visualizer
        expandedWave = new WaveformView(context, Color.parseColor("#ff7a00"));
        LinearLayout.LayoutParams waveParams = new LinearLayout.LayoutParams(dpToPx(42), dpToPx(18));
        waveParams.rightMargin = dpToPx(8);
        expandedWave.setLayoutParams(waveParams);
        topRow.addView(expandedWave);

        // Collapse Button ('X' icon - collapses card back to mini pill)
        expandedCloseBtn = new ImageView(context);
        LinearLayout.LayoutParams closeParams = new LinearLayout.LayoutParams(dpToPx(24), dpToPx(24));
        expandedCloseBtn.setLayoutParams(closeParams);
        expandedCloseBtn.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        expandedCloseBtn.setImageResource(android.R.drawable.ic_menu_close_clear_cancel);
        expandedCloseBtn.setColorFilter(Color.parseColor("#888888"));
        expandedCloseBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                setExpanded(false);
            }
        });
        topRow.addView(expandedCloseBtn);

        card.addView(topRow);

        // ROW 2: Seekbar
        expandedSeekBar = new SeekBar(context);
        LinearLayout.LayoutParams seekParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        seekParams.topMargin = dpToPx(14);
        seekParams.bottomMargin = dpToPx(2);
        expandedSeekBar.setLayoutParams(seekParams);
        expandedSeekBar.setMax(1000);
        expandedSeekBar.setPadding(dpToPx(4), 0, dpToPx(4), 0);
        expandedSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser && currentDurationMs > 0) {
                    long targetPos = (progress * currentDurationMs) / 1000;
                    if (expandedTimeCurrent != null) {
                        expandedTimeCurrent.setText(formatTime(targetPos / 1000));
                    }
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {
                isUserSeeking = true;
            }

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {
                isUserSeeking = false;
                if (currentDurationMs > 0) {
                    long targetPos = (seekBar.getProgress() * currentDurationMs) / 1000;
                    currentPositionMs = targetPos;
                    Intent seekIntent = new Intent(context, BackgroundAudioService.class);
                    seekIntent.setAction(BackgroundAudioService.ACTION_SEEK);
                    seekIntent.putExtra(BackgroundAudioService.EXTRA_POSITION, (int) targetPos);
                    context.startService(seekIntent);
                }
            }
        });
        card.addView(expandedSeekBar);

        // Timestamps (00:13 ... 03:30)
        LinearLayout timeRow = new LinearLayout(context);
        timeRow.setOrientation(LinearLayout.HORIZONTAL);
        timeRow.setLayoutParams(new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        timeRow.setPadding(dpToPx(4), 0, dpToPx(4), 0);

        expandedTimeCurrent = new TextView(context);
        expandedTimeCurrent.setText("00:00");
        expandedTimeCurrent.setTextColor(Color.parseColor("#999999"));
        expandedTimeCurrent.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        expandedTimeCurrent.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        timeRow.addView(expandedTimeCurrent);

        expandedTimeDuration = new TextView(context);
        expandedTimeDuration.setText("00:00");
        expandedTimeDuration.setTextColor(Color.parseColor("#999999"));
        expandedTimeDuration.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        expandedTimeDuration.setGravity(Gravity.END);
        expandedTimeDuration.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1.0f));
        timeRow.addView(expandedTimeDuration);

        card.addView(timeRow);

        // ROW 3: Centered Controls (|<<   ||   >>|)
        LinearLayout controlsRow = new LinearLayout(context);
        controlsRow.setOrientation(LinearLayout.HORIZONTAL);
        controlsRow.setGravity(Gravity.CENTER);
        LinearLayout.LayoutParams controlsParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        controlsParams.topMargin = dpToPx(10);
        controlsRow.setLayoutParams(controlsParams);

        // Previous
        expandedPrev = new ImageView(context);
        LinearLayout.LayoutParams prevParams = new LinearLayout.LayoutParams(dpToPx(32), dpToPx(32));
        prevParams.rightMargin = dpToPx(32);
        expandedPrev.setLayoutParams(prevParams);
        expandedPrev.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        expandedPrev.setImageResource(android.R.drawable.ic_media_previous);
        expandedPrev.setColorFilter(Color.WHITE);
        expandedPrev.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendAction(BackgroundAudioService.ACTION_PREV);
            }
        });
        controlsRow.addView(expandedPrev);

        // Play/Pause (Center large)
        expandedPlayPause = new ImageView(context);
        LinearLayout.LayoutParams ppParams = new LinearLayout.LayoutParams(dpToPx(40), dpToPx(40));
        expandedPlayPause.setLayoutParams(ppParams);
        expandedPlayPause.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        expandedPlayPause.setImageResource(isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play);
        expandedPlayPause.setColorFilter(Color.WHITE);
        expandedPlayPause.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendAction(isPlaying ? BackgroundAudioService.ACTION_PAUSE : BackgroundAudioService.ACTION_RESUME);
            }
        });
        controlsRow.addView(expandedPlayPause);

        // Next
        expandedNext = new ImageView(context);
        LinearLayout.LayoutParams nextBtnParams = new LinearLayout.LayoutParams(dpToPx(32), dpToPx(32));
        nextBtnParams.leftMargin = dpToPx(32);
        expandedNext.setLayoutParams(nextBtnParams);
        expandedNext.setScaleType(ImageView.ScaleType.CENTER_INSIDE);
        expandedNext.setImageResource(android.R.drawable.ic_media_next);
        expandedNext.setColorFilter(Color.WHITE);
        expandedNext.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                sendAction(BackgroundAudioService.ACTION_NEXT);
            }
        });
        controlsRow.addView(expandedNext);

        card.addView(controlsRow);

        // ROW 4: Subtle "Sembunyikan Overlay" button
        TextView hideBtn = new TextView(context);
        hideBtn.setText("Sembunyikan Dynamic Island");
        hideBtn.setTextColor(Color.parseColor("#66FFFFFF"));
        hideBtn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        hideBtn.setGravity(Gravity.CENTER);
        hideBtn.setPadding(0, dpToPx(12), 0, dpToPx(2));
        hideBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dismiss();
            }
        });
        card.addView(hideBtn);

        return card;
    }

    private void sendAction(String action) {
        try {
            Intent intent = new Intent(context, BackgroundAudioService.class);
            intent.setAction(action);
            context.startService(intent);
        } catch (Exception ignored) {}
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

    // --- Dynamic Music Waveform Visualizer View ---
    public static class WaveformView extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final int barCount = 7;
        private final float[] currentHeights = new float[barCount];
        private final float[] targetHeights = new float[barCount];
        private final java.util.Random random = new java.util.Random();
        private final Handler animHandler = new Handler(Looper.getMainLooper());
        private boolean isPlaying = false;
        private int tickCount = 0;

        private final Runnable animRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isPlaying) {
                    boolean stillDecaying = false;
                    for (int i = 0; i < barCount; i++) {
                        if (currentHeights[i] > 0.18f) {
                            currentHeights[i] -= 0.04f;
                            stillDecaying = true;
                        } else {
                            currentHeights[i] = 0.18f;
                        }
                    }
                    invalidate();
                    if (stillDecaying) {
                        animHandler.postDelayed(this, 30);
                    }
                    return;
                }

                tickCount++;
                if (tickCount % 2 == 0) {
                    for (int i = 0; i < barCount; i++) {
                        float min = (i >= 2 && i <= 4) ? 0.45f : 0.25f;
                        float max = (i >= 2 && i <= 4) ? 1.0f : 0.8f;
                        targetHeights[i] = min + (random.nextFloat() * (max - min));
                    }
                }

                for (int i = 0; i < barCount; i++) {
                    currentHeights[i] += (targetHeights[i] - currentHeights[i]) * 0.4f;
                }

                invalidate();
                animHandler.postDelayed(this, 35); // ~30 fps buttery smooth visualizer
            }
        };

        public WaveformView(Context context, int waveColor) {
            super(context);
            paint.setColor(waveColor);
            paint.setStyle(Paint.Style.FILL);
            for (int i = 0; i < barCount; i++) {
                currentHeights[i] = 0.2f;
                targetHeights[i] = 0.2f;
            }
        }

        public void setPlaying(boolean isPlaying) {
            this.isPlaying = isPlaying;
            animHandler.removeCallbacks(animRunnable);
            animHandler.post(animRunnable);
        }

        @Override
        protected void onDetachedFromWindow() {
            super.onDetachedFromWindow();
            animHandler.removeCallbacks(animRunnable);
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            int w = getWidth();
            int h = getHeight();
            if (w == 0 || h == 0) return;

            float barW = dpToPx(3.0f);
            float gap = dpToPx(2.5f);
            float totalW = (barCount * barW) + ((barCount - 1) * gap);
            float startX = (w - totalW) / 2f;

            for (int i = 0; i < barCount; i++) {
                float barH = Math.max(dpToPx(3), h * currentHeights[i]);
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
