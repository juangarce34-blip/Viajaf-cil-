package com.viajafacil.app;

import static org.junit.Assert.*;
import android.content.Intent;
import android.os.Bundle;
import android.os.Parcel;
import android.view.KeyEvent;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.runner.intent.IntentCallback;
import androidx.test.runner.intent.IntentMonitorRegistry;
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

    @Test public void moneyNetworkFailureAndPreferences() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            AtomicReference<MainActivity> reference = new AtomicReference<>();
            scenario.onActivity(reference::set);
            MainActivity activity = reference.get(); ready(activity);
            assertEquals("true", javascript(activity,
                "document.getElementById('tripDestination').value='Londres'; document.getElementById('tripCountry').value='Reino Unido'; " +
                "localStorage.setItem('vf8-provider-preferences',JSON.stringify({operator:'o2',bank:'n26'})); " +
                "localStorage.setItem('vf8-fx-GBP',JSON.stringify({currency:'GBP',rate:0.86,date:'2026-10-16',retrievedAt:'2026-10-17T12:00:00Z'})); " +
                "window.vfMoneyFetch=async()=>{throw new TypeError('Fallo de red simulado')}; show('personal'); document.querySelector('#travelMoney.active')!==null && document.getElementById('moneyOperator').value==='o2'"));
            for (int attempt=0; attempt<200; attempt++) {
                if ("true".equals(javascript(activity,"document.getElementById('moneyRateStatus').textContent.includes('desactualizado')"))) {
                    assertEquals(javascript(activity,"document.getElementById('moneyConverted').textContent + ' | ' + document.getElementById('moneyRateStatus').textContent + ' | ' + document.getElementById('moneyDirection').value"),"true",javascript(activity,"document.getElementById('moneyConverted').textContent.includes('86 GBP')")); return;
                }
                Thread.sleep(100);
            }
            fail("No se recuperó el cambio: " + javascript(activity,"document.getElementById('moneyRateStatus').textContent"));
        }
    }

    @Test public void largeExportCanBeCancelledWithoutOversizedSavedState() throws Exception {
        try (ActivityScenario<MainActivity> scenario = ActivityScenario.launch(MainActivity.class)) {
            AtomicReference<MainActivity> reference = new AtomicReference<>();
            scenario.onActivity(reference::set);
            MainActivity activity = reference.get();
            ready(activity);
            CountDownLatch picker = new CountDownLatch(1);
            IntentCallback monitor = intent -> {
                if (Intent.ACTION_CREATE_DOCUMENT.equals(intent.getAction())) picker.countDown();
            };
            IntentMonitorRegistry.getInstance().addIntentCallback(monitor);
            try {
                javascript(activity, "window.exportCancelled = null; window.exportFailure = null; " +
                    "Capacitor.Plugins.TravelFiles.saveBackup({data: JSON.stringify({padding:'x'.repeat(2*1024*1024)})," +
                    "name:'ViajaFacil-copia-2026-10-15.json'}).then(r => window.exportCancelled=r.cancelled).catch(e => window.exportFailure=e.message); true");
                assertTrue("Se abrió el selector de documentos", picker.await(10, TimeUnit.SECONDS));
                Bundle state = new Bundle();
                InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> activity.getBridge().saveInstanceState(state));
                Parcel parcel = Parcel.obtain();
                try {
                    parcel.writeBundle(state);
                    assertTrue("La copia no entra en el Bundle de Android", parcel.dataSize() < 100000);
                } finally { parcel.recycle(); }
                Thread.sleep(1000);
                InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
                for (int attempt = 0; attempt < 100; attempt++) {
                    if ("true".equals(javascript(activity, "window.exportCancelled === true"))) return;
                    Thread.sleep(100);
                }
                fail("La cancelación no respondió: " + javascript(activity, "window.exportFailure"));
            } finally { IntentMonitorRegistry.getInstance().removeIntentCallback(monitor); }
        }
    }
}

