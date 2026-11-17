package com.melktoday.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    public static final String CHANNEL_GENERAL_ID = "melktoday_general";
    public static final String CHANNEL_CHAT_ID = "melktoday_chat";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannels();
        configureWebViewSettings();
    }

    private void configureWebViewSettings() {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();

            // Enable storage & performance options
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMediaPlaybackRequiresUserGesture(false);

            // Configure Cookie Persistence
            CookieManager cookieManager = CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            cookieManager.setAcceptThirdPartyCookies(webView, true);
        }
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                // General & Property Updates Channel
                NotificationChannel generalChannel = new NotificationChannel(
                    CHANNEL_GENERAL_ID,
                    "اعلان‌های عمومی و املاک",
                    NotificationManager.IMPORTANCE_HIGH
                );
                generalChannel.setDescription("اعلان‌های وضعیت آگهی، ثبت‌نام و اطلاعیه‌های سامانه ملک تودی");
                generalChannel.enableVibration(true);
                manager.createNotificationChannel(generalChannel);

                // Direct Chat Channel
                NotificationChannel chatChannel = new NotificationChannel(
                    CHANNEL_CHAT_ID,
                    "پیام‌های گفتگو",
                    NotificationManager.IMPORTANCE_HIGH
                );
                chatChannel.setDescription("پیام‌های مستقیم گفتگو میان خریداران، مالکین و مشاورین املاک");
                chatChannel.enableVibration(true);
                manager.createNotificationChannel(chatChannel);
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Flush cookies to persistent disk storage to preserve JWT session across app kills
        CookieManager.getInstance().flush();
    }

    @Override
    protected void onStop() {
        super.onStop();
        CookieManager.getInstance().flush();
    }
}
