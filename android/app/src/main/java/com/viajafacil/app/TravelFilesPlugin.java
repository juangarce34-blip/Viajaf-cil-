package com.viajafacil.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

/** Uses Android's document picker: no broad storage permission or public temporary copy. */
@CapacitorPlugin(name = "TravelFiles")
public class TravelFilesPlugin extends Plugin {
    @Override public void load() {
        // Clear abandoned exports after a day; never touch other application cache files.
        getBridge().execute(() -> {
            File[] files = getContext().getCacheDir().listFiles();
            if (files == null) return;
            long cutoff = System.currentTimeMillis() - 86400000L;
            for (File file : files) {
                if (file.getName().startsWith("vf-backup-") && file.getName().endsWith(".json") && file.lastModified() < cutoff) file.delete();
            }
        });
    }

    @PluginMethod public void saveBackup(PluginCall call) {
        String data = call.getString("data");
        String name = call.getString("name", "ViajaFacil-copia.json");
        if (data == null || data.getBytes(StandardCharsets.UTF_8).length > 5 * 1024 * 1024 ||
            !name.matches("ViajaFacil-copia(?:-[0-9-]+)?\\.json")) {
            call.reject("La copia no es válida o supera los 5 MB.");
            return;
        }
        // Capacitor persists pending call options during Activity recreation. Keep megabytes
        // out of the saved-state Bundle (Binder transaction limit), using private cache instead.
        File pending = null;
        try {
            pending = File.createTempFile("vf-backup-", ".json", getContext().getCacheDir());
            try (OutputStream output = new FileOutputStream(pending)) {
                output.write(data.getBytes(StandardCharsets.UTF_8));
            }
            call.getData().remove("data");
            call.getData().put("cacheName", pending.getName());
        } catch (Exception error) {
            if (pending != null) pending.delete();
            call.reject("No hay espacio para preparar la copia."); return;
        }
        final File prepared = pending;
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, name);
        getActivity().runOnUiThread(() -> {
            try { startActivityForResult(call, intent, "backupCreated"); }
            catch (Exception error) { prepared.delete(); call.reject("No se pudo abrir el selector de archivos."); }
        });
    }

    @ActivityCallback private void backupCreated(PluginCall call, ActivityResult result) {
        if (call == null) return;
        String cacheName = call.getString("cacheName");
        if (cacheName == null || !cacheName.matches("vf-backup-[a-zA-Z0-9-]+\\.json")) {
            call.reject("La copia ya no está disponible. Vuelve a exportarla."); return;
        }
        File pending = new File(getContext().getCacheDir(), cacheName);
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            pending.delete();
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }
        Uri uri = result.getData().getData();
        if (!"content".equals(uri.getScheme())) { pending.delete(); call.reject("La ubicación elegida no es un documento compatible."); return; }
        getBridge().execute(() -> {
            try {
                try (FileInputStream input = new FileInputStream(pending);
                     OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                    if (output == null) throw new java.io.IOException("No output stream");
                    byte[] buffer = new byte[8192];
                    int count;
                    while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
                    output.flush();
                }
                JSObject response = new JSObject();
                response.put("cancelled", false);
                call.resolve(response);
            } catch (Exception error) { call.reject("No se pudo guardar la copia. Elige otra ubicación."); }
            finally { pending.delete(); }
        });
    }

    @PluginMethod public void openExternal(PluginCall call) {
        String url = call.getString("url");
        if (url == null) { call.reject("Falta el enlace."); return; }
        Uri uri = Uri.parse(url);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || uri.getHost() == null) {
            call.reject("Solo se permiten enlaces HTTPS."); return;
        }
        try {
            getActivity().startActivity(new Intent(Intent.ACTION_VIEW, uri).addCategory(Intent.CATEGORY_BROWSABLE));
            call.resolve();
        } catch (Exception error) { call.reject("No hay un navegador disponible."); }
    }
}
