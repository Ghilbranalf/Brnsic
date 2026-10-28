package com.brnsic.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.media.session.MediaButtonReceiver;

public class BackgroundAudioService extends Service implements
        MediaPlayer.OnPreparedListener,
        MediaPlayer.OnCompletionListener,
        MediaPlayer.OnErrorListener {

    public static final String CHANNEL_ID = "brnsic_background_playback";
    public static final int NOTIFICATION_ID = 2026;

    public static final String ACTION_START = "com.brnsic.app.action.START";
    public static final String ACTION_PLAY = "com.brnsic.app.action.PLAY";
    public static final String ACTION_PAUSE = "com.brnsic.app.action.PAUSE";
    public static final String ACTION_RESUME = "com.brnsic.app.action.RESUME";
    public static final String ACTION_SEEK = "com.brnsic.app.action.SEEK";
    public static final String ACTION_VOLUME = "com.brnsic.app.action.VOLUME";
    public static final String ACTION_STOP = "com.brnsic.app.action.STOP";
    public static final String ACTION_PREV = "com.brnsic.app.action.PREV";
    public static final String ACTION_NEXT = "com.brnsic.app.action.NEXT";
    public static final String ACTION_LIKE = "com.brnsic.app.action.LIKE";
    public static final String ACTION_UPDATE_STATE = "com.brnsic.app.action.UPDATE_STATE";

    public static final String EXTRA_URL = "extra_url";
    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_POSITION = "extra_position";
    public static final String EXTRA_DURATION = "extra_duration";
    public static final String EXTRA_VOLUME = "extra_volume";
    public static final String EXTRA_COVER = "extra_cover";
    public static final String EXTRA_IS_PLAYING = "extra_is_playing";

    private MediaPlayer mediaPlayer;
    private WifiManager.WifiLock wifiLock;
    private MediaSessionCompat mediaSession;
    private DynamicIslandOverlay dynamicIslandOverlay;

    private static boolean isAppInForeground = true;
    private static BackgroundAudioService activeInstance = null;

    private String currentTitle = "Brnsic Music";
    private String currentArtist = "Memutar di latar belakang";
    private String currentCoverUrl = "";
    private Bitmap currentCoverBitmap = null;
    private long currentDurationMs = 210000;
    private long currentPositionMs = 0;
    private boolean isPlaybackActive = false;
    private int seekOnPrepared = 0;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public static void setAppForegroundState(boolean inForeground) {
        isAppInForeground = inForeground;
        if (activeInstance != null) {
            activeInstance.mainHandler.post(new Runnable() {
                @Override
                public void run() {
                    activeInstance.refreshOverlayState();
                }
            });
        }
    }

    private void refreshOverlayState() {
        if (dynamicIslandOverlay == null) return;
        if (isPlaybackActive && !isAppInForeground && DynamicIslandOverlay.canDrawOverlay(this)) {
            dynamicIslandOverlay.show();
            dynamicIslandOverlay.update(currentCoverBitmap, isPlaybackActive);
        } else {
            dynamicIslandOverlay.hide();
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        activeInstance = this;
        dynamicIslandOverlay = new DynamicIslandOverlay(this);
        createNotificationChannel();
        initMediaSession();
        initMediaPlayer();

        try {
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "Brnsic:WifiLock");
                wifiLock.setReferenceCounted(false);
            }
        } catch (Exception ignored) {}
    }

    private void initMediaSession() {
        if (mediaSession != null) return;
        try {
            ComponentName mediaButtonReceiver = new ComponentName(getApplicationContext(), MediaButtonReceiver.class);
            mediaSession = new MediaSessionCompat(getApplicationContext(), "BrnsicAudioSession", mediaButtonReceiver, null);
            mediaSession.setFlags(
                    MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS |
                    MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
            );

            mediaSession.setCallback(new MediaSessionCompat.Callback() {
                @Override
                public void onPlay() {
                    resumePlayback();
                    MainActivity.notifyPlaybackState(true);
                }

                @Override
                public void onPause() {
                    pausePlayback();
                    MainActivity.notifyPlaybackState(false);
                }

                @Override
                public void onSkipToNext() {
                    MainActivity.notifyNextTrack();
                }

                @Override
                public void onSkipToPrevious() {
                    MainActivity.notifyPrevTrack();
                }

                @Override
                public void onSeekTo(long pos) {
                    currentPositionMs = pos;
                    seekPlayback((int) pos);
                    updatePlaybackState(isPlaybackActive, currentPositionMs);
                    MainActivity.notifySeekTo((int) (pos / 1000));
                }

                @Override
                public void onStop() {
                    stopPlayback();
                    MainActivity.notifyPlaybackState(false);
                }

                @Override
                public void onCustomAction(String action, Bundle extras) {
                    if (ACTION_LIKE.equals(action)) {
                        MainActivity.notifyLikeTrack();
                    }
                }
            });

            mediaSession.setActive(true);
        } catch (Exception ignored) {}
    }

    private void initMediaPlayer() {
        if (mediaPlayer == null) {
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setWakeMode(getApplicationContext(), PowerManager.PARTIAL_WAKE_LOCK);
            AudioAttributes attributes = new AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .build();
            mediaPlayer.setAudioAttributes(attributes);
            mediaPlayer.setOnPreparedListener(this);
            mediaPlayer.setOnCompletionListener(this);
            mediaPlayer.setOnErrorListener(this);
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            if (mediaSession != null) {
                MediaButtonReceiver.handleIntent(mediaSession, intent);
            }

            String action = intent.getAction();
            if (ACTION_STOP.equals(action)) {
                stopPlayback();
                return START_NOT_STICKY;
            }

            if (ACTION_PREV.equals(action)) {
                MainActivity.notifyPrevTrack();
                return START_STICKY;
            }

            if (ACTION_NEXT.equals(action)) {
                MainActivity.notifyNextTrack();
                return START_STICKY;
            }

            if (ACTION_LIKE.equals(action)) {
                MainActivity.notifyLikeTrack();
                return START_STICKY;
            }

            if (ACTION_PAUSE.equals(action)) {
                pausePlayback();
                MainActivity.notifyPlaybackState(false);
                return START_STICKY;
            }

            if (ACTION_RESUME.equals(action)) {
                resumePlayback();
                MainActivity.notifyPlaybackState(true);
                return START_STICKY;
            }

            if (ACTION_SEEK.equals(action)) {
                int pos = intent.getIntExtra(EXTRA_POSITION, 0);
                currentPositionMs = pos;
                seekPlayback(pos);
                updatePlaybackState(isPlaybackActive, currentPositionMs);
                return START_STICKY;
            }

            if (ACTION_UPDATE_STATE.equals(action)) {
                isPlaybackActive = intent.getBooleanExtra(EXTRA_IS_PLAYING, isPlaybackActive);
                int pos = intent.getIntExtra(EXTRA_POSITION, (int) currentPositionMs);
                int dur = intent.getIntExtra(EXTRA_DURATION, (int) currentDurationMs);
                if (dur > 0) currentDurationMs = dur;
                currentPositionMs = pos;
                updateMediaMetadata();
                updatePlaybackState(isPlaybackActive, currentPositionMs);
                startForegroundNotification(currentTitle, currentArtist, isPlaybackActive);
                return START_STICKY;
            }

            if (ACTION_VOLUME.equals(action)) {
                float vol = intent.getFloatExtra(EXTRA_VOLUME, 1.0f);
                setVolumePlayback(vol);
                return START_STICKY;
            }

            if (ACTION_PLAY.equals(action) || ACTION_START.equals(action)) {
                String url = intent.getStringExtra(EXTRA_URL);
                String title = intent.getStringExtra(EXTRA_TITLE);
                String artist = intent.getStringExtra(EXTRA_ARTIST);
                String cover = intent.getStringExtra(EXTRA_COVER);
                int positionMs = intent.getIntExtra(EXTRA_POSITION, 0);
                int durationMs = intent.getIntExtra(EXTRA_DURATION, 0);

                if (title != null && !title.trim().isEmpty()) currentTitle = title;
                if (artist != null && !artist.trim().isEmpty()) currentArtist = artist;
                if (durationMs > 0) currentDurationMs = durationMs;
                currentPositionMs = positionMs;
                isPlaybackActive = true;

                if (cover != null && !cover.trim().isEmpty() && !cover.equals(currentCoverUrl)) {
                    currentCoverUrl = cover;
                    loadCoverBitmapAsync(cover);
                }

                initMediaSession();
                updateMediaMetadata();
                updatePlaybackState(true, currentPositionMs);
                startForegroundNotification(currentTitle, currentArtist, true);

                playAudioSource(url, positionMs);
            }
        }
        return START_STICKY;
    }

    private void updateMediaMetadata() {
        if (mediaSession == null) return;
        try {
            MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                    .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Brnsic")
                    .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_TITLE, currentTitle)
                    .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_SUBTITLE, currentArtist)
                    .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, currentDurationMs);

            if (currentCoverBitmap != null) {
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentCoverBitmap);
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, currentCoverBitmap);
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_DISPLAY_ICON, currentCoverBitmap);
            }

            mediaSession.setMetadata(metaBuilder.build());
        } catch (Exception ignored) {}
    }

    private void updatePlaybackState(boolean isPlaying, long positionMs) {
        if (mediaSession == null) return;
        try {
            long actions = PlaybackStateCompat.ACTION_PLAY
                    | PlaybackStateCompat.ACTION_PAUSE
                    | PlaybackStateCompat.ACTION_PLAY_PAUSE
                    | PlaybackStateCompat.ACTION_SKIP_TO_NEXT
                    | PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS
                    | PlaybackStateCompat.ACTION_SEEK_TO
                    | PlaybackStateCompat.ACTION_STOP;

            int state = isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED;
            float speed = isPlaying ? 1.0f : 0.0f;

            PlaybackStateCompat.CustomAction likeAction = new PlaybackStateCompat.CustomAction.Builder(
                    ACTION_LIKE,
                    "Suka",
                    R.drawable.ic_heart
            ).build();

            PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                    .setActions(actions)
                    .addCustomAction(likeAction)
                    .setState(state, positionMs, speed);

            mediaSession.setPlaybackState(stateBuilder.build());
        } catch (Exception ignored) {}
    }

    private void loadCoverBitmapAsync(final String urlString) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    java.net.URL url = new java.net.URL(urlString);
                    java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.setConnectTimeout(6000);
                    connection.setReadTimeout(6000);
                    connection.connect();
                    java.io.InputStream input = connection.getInputStream();
                    final Bitmap bitmap = BitmapFactory.decodeStream(input);
                    if (bitmap != null) {
                        mainHandler.post(new Runnable() {
                            @Override
                            public void run() {
                                if (urlString.equals(currentCoverUrl)) {
                                    currentCoverBitmap = bitmap;
                                    updateMediaMetadata();
                                    startForegroundNotification(currentTitle, currentArtist, isPlaybackActive);
                                    if (dynamicIslandOverlay != null) {
                                        dynamicIslandOverlay.update(currentCoverBitmap, isPlaybackActive);
                                    }
                                }
                            }
                        });
                    }
                } catch (Exception ignored) {}
            }
        }).start();
    }

    private void playAudioSource(String url, int positionMs) {
        try {
            initMediaPlayer();
            if (wifiLock != null && !wifiLock.isHeld()) {
                wifiLock.acquire();
            }

            if (url != null && url.startsWith("http")) {
                seekOnPrepared = positionMs;
                mediaPlayer.reset();
                mediaPlayer.setDataSource(getApplicationContext(), Uri.parse(url));
                mediaPlayer.prepareAsync();
            } else {
                playFallbackAudio();
            }
        } catch (Exception e) {
            playFallbackAudio();
        }
    }

    private void playFallbackAudio() {
        try {
            initMediaPlayer();
            mediaPlayer.reset();
            AssetFileDescriptor afd = getResources().openRawResourceFd(R.raw.silence);
            if (afd != null) {
                mediaPlayer.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
                afd.close();
                mediaPlayer.setLooping(true);
                mediaPlayer.prepare();
                mediaPlayer.start();
            }
        } catch (Exception ignored) {}
    }

    private void pausePlayback() {
        try {
            isPlaybackActive = false;
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
            }
            updatePlaybackState(false, currentPositionMs);
            startForegroundNotification(currentTitle, currentArtist, false);
            refreshOverlayState();
        } catch (Exception ignored) {}
    }

    private void resumePlayback() {
        try {
            isPlaybackActive = true;
            if (mediaPlayer != null) {
                mediaPlayer.start();
            } else {
                playFallbackAudio();
            }
            updatePlaybackState(true, currentPositionMs);
            startForegroundNotification(currentTitle, currentArtist, true);
            refreshOverlayState();
        } catch (Exception ignored) {}
    }

    private void seekPlayback(int positionMs) {
        try {
            currentPositionMs = positionMs;
            if (mediaPlayer != null) {
                mediaPlayer.seekTo(positionMs);
            }
        } catch (Exception ignored) {}
    }

    private void setVolumePlayback(float vol) {
        try {
            if (mediaPlayer != null) {
                float clamped = Math.max(0.0f, Math.min(1.0f, vol));
                mediaPlayer.setVolume(clamped, clamped);
            }
        } catch (Exception ignored) {}
    }

    private void stopPlayback() {
        try {
            isPlaybackActive = false;
            updatePlaybackState(false, currentPositionMs);
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
            }
            if (wifiLock != null && wifiLock.isHeld()) {
                wifiLock.release();
            }
        } catch (Exception ignored) {}

        if (dynamicIslandOverlay != null) {
            dynamicIslandOverlay.hide();
        }
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onPrepared(MediaPlayer mp) {
        try {
            if (seekOnPrepared > 0) {
                mp.seekTo(seekOnPrepared);
                seekOnPrepared = 0;
            }
            mp.start();
            isPlaybackActive = true;
            updatePlaybackState(true, currentPositionMs);
            startForegroundNotification(currentTitle, currentArtist, true);
            refreshOverlayState();
        } catch (Exception ignored) {}
    }

    @Override
    public void onCompletion(MediaPlayer mp) {
        isPlaybackActive = false;
        updatePlaybackState(false, currentPositionMs);
        startForegroundNotification(currentTitle, currentArtist, false);
        refreshOverlayState();
        MainActivity.notifyTrackCompleted();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        playFallbackAudio();
        return true;
    }

    private void startForegroundNotification(String title, String artist, boolean isPlaying) {
        initMediaSession();
        updateMediaMetadata();
        updatePlaybackState(isPlaying, currentPositionMs);

        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, flags);

        Intent prevIntent = new Intent(this, BackgroundAudioService.class);
        prevIntent.setAction(ACTION_PREV);
        PendingIntent prevPendingIntent = PendingIntent.getService(this, 2, prevIntent, flags);

        Intent toggleIntent = new Intent(this, BackgroundAudioService.class);
        toggleIntent.setAction(isPlaying ? ACTION_PAUSE : ACTION_RESUME);
        int toggleRequestCode = isPlaying ? 101 : 102;
        PendingIntent togglePendingIntent = PendingIntent.getService(this, toggleRequestCode, toggleIntent, flags);

        Intent nextIntent = new Intent(this, BackgroundAudioService.class);
        nextIntent.setAction(ACTION_NEXT);
        PendingIntent nextPendingIntent = PendingIntent.getService(this, 3, nextIntent, flags);

        Intent likeIntent = new Intent(this, BackgroundAudioService.class);
        likeIntent.setAction(ACTION_LIKE);
        PendingIntent likePendingIntent = PendingIntent.getService(this, 4, likeIntent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(artist)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentIntent(pendingIntent)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(isPlaying)
                .setShowWhen(false)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .addAction(R.drawable.ic_prev, "Sebelumnya", prevPendingIntent)
                .addAction(
                        isPlaying ? R.drawable.ic_pause : R.drawable.ic_play,
                        isPlaying ? "Jeda" : "Putar",
                        togglePendingIntent
                )
                .addAction(R.drawable.ic_next, "Berikutnya", nextPendingIntent)
                .addAction(R.drawable.ic_heart, "Suka", likePendingIntent)
                .setStyle(new androidx.media.app.NotificationCompat.MediaStyle()
                        .setMediaSession(mediaSession != null ? mediaSession.getSessionToken() : null)
                        .setShowActionsInCompactView(0, 1, 2));

        if (currentCoverBitmap != null) {
            builder.setLargeIcon(currentCoverBitmap);
        }

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) {
            manager.notify(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Brnsic Music Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Menjaga musik tetap berjalan di latar belakang dan kontrol pemutar di layar kunci");
            channel.setShowBadge(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (dynamicIslandOverlay != null) {
            dynamicIslandOverlay.hide();
            dynamicIslandOverlay = null;
        }
        if (activeInstance == this) {
            activeInstance = null;
        }
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        stopPlayback();
        super.onDestroy();
    }
}
