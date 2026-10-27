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
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.net.wifi.WifiManager;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;

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

    public static final String EXTRA_URL = "extra_url";
    public static final String EXTRA_TITLE = "extra_title";
    public static final String EXTRA_ARTIST = "extra_artist";
    public static final String EXTRA_POSITION = "extra_position";
    public static final String EXTRA_VOLUME = "extra_volume";

    private MediaPlayer mediaPlayer;
    private WifiManager.WifiLock wifiLock;
    private String currentTitle = "Brnsic Music";
    private String currentArtist = "Memutar di latar belakang";
    private int seekOnPrepared = 0;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        initMediaPlayer();

        try {
            WifiManager wm = (WifiManager) getApplicationContext().getSystemService(Context.WIFI_SERVICE);
            if (wm != null) {
                wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "Brnsic:WifiLock");
                wifiLock.setReferenceCounted(false);
            }
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
                int positionMs = intent.getIntExtra(EXTRA_POSITION, 0);

                if (title != null && !title.trim().isEmpty()) currentTitle = title;
                if (artist != null && !artist.trim().isEmpty()) currentArtist = artist;

                startForegroundNotification(currentTitle, currentArtist, true);

                playAudioSource(url, positionMs);
            }
        }
        return START_STICKY;
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
            if (mediaPlayer != null && mediaPlayer.isPlaying()) {
                mediaPlayer.pause();
            }
            startForegroundNotification(currentTitle, currentArtist, false);
        } catch (Exception ignored) {}
    }

    private void resumePlayback() {
        try {
            if (mediaPlayer != null) {
                mediaPlayer.start();
            } else {
                playFallbackAudio();
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
            startForegroundNotification(currentTitle, currentArtist, true);
        } catch (Exception ignored) {}
    }

    @Override
    public void onCompletion(MediaPlayer mp) {
        startForegroundNotification(currentTitle, currentArtist, false);
        MainActivity.notifyTrackCompleted();
    }

    @Override
    public boolean onError(MediaPlayer mp, int what, int extra) {
        // Fallback to native silence loop to maintain active media playback
        playFallbackAudio();
        return true;
    }

    private void startForegroundNotification(String title, String artist, boolean isPlaying) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, flags);

        // Interactive Play/Pause action button on Notification
        Intent toggleIntent = new Intent(this, BackgroundAudioService.class);
        toggleIntent.setAction(isPlaying ? ACTION_PAUSE : ACTION_RESUME);
        PendingIntent togglePendingIntent = PendingIntent.getService(this, 1, toggleIntent, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(title)
                .setContentText(artist)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentIntent(pendingIntent)
                .addAction(
                        isPlaying ? android.R.drawable.ic_media_pause : android.R.drawable.ic_media_play,
                        isPlaying ? "Jeda" : "Putar",
                        togglePendingIntent
                )
                .setOngoing(isPlaying)
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

        Notification notification = builder.build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Brnsic Music Playback",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Menjaga musik tetap berjalan di latar belakang saat layar mati");
            channel.setShowBadge(false);
            NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    @Override
    public void onDestroy() {
        stopPlayback();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
