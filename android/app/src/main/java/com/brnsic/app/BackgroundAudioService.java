package com.brnsic.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
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
import android.os.IBinder;
import android.os.PowerManager;
import android.support.v4.media.MediaMetadataCompat;
import android.support.v4.media.session.MediaSessionCompat;
import android.support.v4.media.session.PlaybackStateCompat;
import androidx.core.app.NotificationCompat;
import androidx.media.app.NotificationCompat.MediaStyle;

public class BackgroundAudioService extends Service implements
        MediaPlayer.OnPreparedListener,
        MediaPlayer.OnCompletionListener,
        MediaPlayer.OnErrorListener {

    public static final String CHANNEL_ID = "brnsic_media_playback_v3";
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

    public static final String EXTRA_URL = "extra_url";
    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_POSITION = "extra_position";
    public static final String EXTRA_VOLUME = "extra_volume";
    public static final String EXTRA_COVER = "extra_cover";

    private MediaPlayer mediaPlayer;
    private MediaSessionCompat mediaSession;
    private WifiManager.WifiLock wifiLock;
    private String currentTitle = "Brnsic Music";
    private String currentArtist = "Memutar di latar belakang";
    private String currentCoverUrl = "";
    private Bitmap currentCoverBitmap = null;
    private int seekOnPrepared = 0;
    private boolean isCurrentPlaying = false;

    @Override
    public void onCreate() {
        super.onCreate();
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
        try {
            mediaSession = new MediaSessionCompat(this, "BrnsicMediaSession");
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
                public void onStop() {
                    pausePlayback();
                    MainActivity.notifyPlaybackState(false);
                }

                @Override
                public void onSeekTo(long pos) {
                    seekPlayback((int) pos);
                    MainActivity.notifySeek((int) pos);
                }
            });
            mediaSession.setActive(true);
        } catch (Exception ignored) {}
    }

    private void updateMediaSession(boolean isPlaying) {
        if (mediaSession == null) return;
        try {
            long actions = PlaybackStateCompat.ACTION_PLAY |
                    PlaybackStateCompat.ACTION_PAUSE |
                    PlaybackStateCompat.ACTION_PLAY_PAUSE |
                    PlaybackStateCompat.ACTION_SKIP_TO_NEXT |
                    PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS |
                    PlaybackStateCompat.ACTION_SEEK_TO |
                    PlaybackStateCompat.ACTION_STOP;

            long position = 0;
            if (mediaPlayer != null) {
                try { position = mediaPlayer.getCurrentPosition(); } catch (Exception ignored) {}
            }

            PlaybackStateCompat.Builder stateBuilder = new PlaybackStateCompat.Builder()
                    .setActions(actions)
                    .setState(
                            isPlaying ? PlaybackStateCompat.STATE_PLAYING : PlaybackStateCompat.STATE_PAUSED,
                            position,
                            1.0f
                    );
            mediaSession.setPlaybackState(stateBuilder.build());

            MediaMetadataCompat.Builder metaBuilder = new MediaMetadataCompat.Builder()
                    .putString(MediaMetadataCompat.METADATA_KEY_TITLE, currentTitle)
                    .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, currentArtist)
                    .putString(MediaMetadataCompat.METADATA_KEY_ALBUM, "Brnsic")
                    .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_TITLE, currentTitle)
                    .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_SUBTITLE, currentArtist);

            if (currentCoverBitmap != null) {
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ALBUM_ART, currentCoverBitmap);
                metaBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, currentCoverBitmap);
            }
            mediaSession.setMetadata(metaBuilder.build());
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
                seekPlayback(pos);
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

                if (title != null && !title.trim().isEmpty()) currentTitle = title;
                if (artist != null && !artist.trim().isEmpty()) currentArtist = artist;

                isCurrentPlaying = true;

                if (cover != null && !cover.trim().isEmpty() && !cover.equals(currentCoverUrl)) {
                    currentCoverUrl = cover;
                    loadCoverBitmapAsync(cover);
                }

                startForegroundNotification(currentTitle, currentArtist, true);
                playAudioSource(url, positionMs);
            }
        }
        return START_STICKY;
    }

    private void loadCoverBitmapAsync(final String rawUrl) {
        if (rawUrl == null || rawUrl.trim().isEmpty()) return;
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String urlString = rawUrl.trim();
                    if (urlString.startsWith("//")) {
                        urlString = "https:" + urlString;
                    } else if (urlString.startsWith("/")) {
                        urlString = "https://brnsic.vercel.app" + urlString;
                    }
                    java.net.URL url = new java.net.URL(urlString);
                    java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
                    connection.setDoInput(true);
                    connection.setConnectTimeout(8000);
                    connection.setReadTimeout(8000);
                    connection.connect();
                    java.io.InputStream input = connection.getInputStream();
                    Bitmap bitmap = BitmapFactory.decodeStream(input);
                    if (bitmap != null) {
                        currentCoverBitmap = bitmap;
                        new android.os.Handler(android.os.Looper.getMainLooper()).post(new Runnable() {
                            @Override
                            public void run() {
                                startForegroundNotification(currentTitle, currentArtist, isCurrentPlaying);
                            }
                        });
                    }
                } catch (Exception ignored) {}
            }
        }).start();
    }

    private void playAudioSource(String url, int positionMs) {
        try {
            if (url != null && url.startsWith("http")) {
                initMediaPlayer();
                seekOnPrepared = positionMs;
                mediaPlayer.reset();
                mediaPlayer.setDataSource(getApplicationContext(), Uri.parse(url));
                mediaPlayer.prepareAsync();
            }
        } catch (Exception ignored) {}
    }

    private void pausePlayback() {
        try {
            isCurrentPlaying = false;
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
            }
            startForegroundNotification(currentTitle, currentArtist, false);
        } catch (Exception ignored) {}
    }

    private void resumePlayback() {
        try {
            isCurrentPlaying = true;
            if (mediaPlayer != null && !mediaPlayer.isPlaying()) {
                mediaPlayer.start();
            }
            startForegroundNotification(currentTitle, currentArtist, true);
        } catch (Exception ignored) {}
    }

    private void seekPlayback(int positionMs) {
        try {
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
            isCurrentPlaying = false;
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
            isCurrentPlaying = true;
            startForegroundNotification(currentTitle, currentArtist, true);
        } catch (Exception ignored) {}
    }

    @Override
    public void onCompletion(MediaPlayer mp) {
        isCurrentPlaying = false;
        startForegroundNotification(currentTitle, currentArtist, false);
        MainActivity.notifyTrackCompleted();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        return true;
    }

    private void startForegroundNotification(String title, String artist, boolean isPlaying) {
        this.isCurrentPlaying = isPlaying;
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
        PendingIntent togglePendingIntent = PendingIntent.getService(this, 1, toggleIntent, flags);

        Intent nextIntent = new Intent(this, BackgroundAudioService.class);
        nextIntent.setAction(ACTION_NEXT);
        PendingIntent nextPendingIntent = PendingIntent.getService(this, 3, nextIntent, flags);

        updateMediaSession(isPlaying);

        MediaStyle mediaStyle = new MediaStyle()
                .setShowActionsInCompactView(0, 1, 2);

        if (mediaSession != null) {
            mediaStyle.setMediaSession(mediaSession.getSessionToken());
        }

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(artist)
                .setSubText("Brnsic")
                .setSmallIcon(R.drawable.ic_notification)
                .setContentIntent(pendingIntent)
                .addAction(R.drawable.ic_prev, "Sebelumnya", prevPendingIntent)
                .addAction(
                        isPlaying ? R.drawable.ic_pause : R.drawable.ic_play,
                        isPlaying ? "Jeda" : "Putar",
                        togglePendingIntent
                )
                .addAction(R.drawable.ic_next, "Berikutnya", nextPendingIntent)
                .setStyle(mediaStyle)
                .setColorized(true)
                .setColor(0xFF13111C)
                .setOngoing(isPlaying)
                .setOnlyAlertOnce(true)
                .setShowWhen(false)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        if (currentCoverBitmap != null) {
            builder.setLargeIcon(currentCoverBitmap);
        }

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        try {
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.notify(NOTIFICATION_ID, notification);
            }
        } catch (Exception ignored) {}
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Brnsic Media Player",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Kontrol pemutar musik di notifikasi dan layar kunci");
            channel.setShowBadge(true);
            channel.setSound(null, null);
            channel.enableVibration(false);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            try {
                mediaSession.setActive(false);
                mediaSession.release();
            } catch (Exception ignored) {}
            mediaSession = null;
        }
        stopPlayback();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
