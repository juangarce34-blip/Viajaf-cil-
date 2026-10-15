package com.viajafacil.app;

import static org.junit.Assert.*;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class AndroidSmokeTest {
    private String javascript(MainActivity activity, String expression) throws Exception {
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<String> value = new AtomicReference<>();
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() ->
            activity.getBridge().getWebView().evaluateJavascript(expression, result -> {
                value.set(result); done.countDown();
            }));
        assertTrue("JavaScript respondió", done.await(10, TimeUnit.SECONDS));
        return value.get();
    }

    private void ready(MainActivity activity) throws Exception {
        for (int attempt = 0; attempt < 200; attempt++) {
            if ("true".equals(javascript(activity,
                "Boolean(document.getElementById('geoPlanner') && window.ViajaBackup && window.Capacitor && window.Capacitor.isNativePlatform())"))) return;
            Thread.sleep(100);
        }
        fail("La aplicación incluida en el APK no arrancó");
    }

    @Test public void offlineBootNativeBridgeAndPersistence() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            AtomicReference<MainActivity> reference = new AtomicReference<>();
            scenario.onActivity(reference::set);
            MainActivity activity = reference.get();
            ready(activity);
            assertEquals("true", javascript(activity, "Capacitor.isPluginAvailable('TravelFiles')"));
            assertEquals("true", javascript(activity, "Capacitor.isPluginAvailable('App')"));
            assertEquals("true", javascript(activity, "location.origin === 'https://localhost'"));
            assertEquals("true", javascript(activity,
                "show('dayPlanner'); Boolean(document.querySelector('#dayPlanner.active'))"));
            assertEquals("true", javascript(activity,
                "localStorage.setItem('vf-android-smoke','conservado'); vf8SaveActive(); true"));
            InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getBridge().getWebView().reload());
            Thread.sleep(1000);
            ready(activity);
            assertEquals("true", javascript(activity, "localStorage.getItem('vf-android-smoke') === 'conservado'"));
            javascript(activity, "localStorage.removeItem('vf-android-smoke'); vf8SaveActive(); true");
        }
    }
}
