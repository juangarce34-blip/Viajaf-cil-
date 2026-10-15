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
import java.nio.charset.StandardCharsets;

/** Uses Android's document picker: no broad storage permission or public temporary copy. */
@CapacitorPlugin(name = "TravelFiles")
public class TravelFilesPlugin extends Plugin {
    @PluginMethod public void saveBackup(PluginCall call) {
        String data = call.getString("data");
        String name = call.getString("name", "ViajaFacil-copia.json");
        if (data == null || data.getBytes(StandardCharsets.UTF_8).length > 5 * 1024 * 1024 ||
            !name.matches("ViajaFacil-copia(?:-[0-9-]+)?\\.json")) {
            call.reject("La copia no es válida o supera los 5 MB.");
            return;
        }
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, name);
        try { startActivityForResult(call, intent, "backupCreated"); }
        catch (Exception error) { call.reject("No se pudo abrir el selector de archivos."); }
    }

    @ActivityCallback private void backupCreated(PluginCall call, ActivityResult result) {
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null || result.getData().getData() == null) {
            JSObject response = new JSObject();
            response.put("cancelled", true);
            call.resolve(response);
            return;
        }
        Uri uri = result.getData().getData();
        String data = call.getString("data");
        if (data == null) { call.reject("La copia ya no está disponible. Vuelve a exportarla."); return; }
        getBridge().execute(() -> {
            try (OutputStream output = getContext().getContentResolver().openOutputStream(uri, "wt")) {
                if (output == null) throw new java.io.IOException("No output stream");
                output.write(data.getBytes(StandardCharsets.UTF_8));
                output.flush();
                JSObject response = new JSObject();
                response.put("cancelled", false);
                call.resolve(response);
            } catch (Exception error) { call.reject("No se pudo guardar la copia. Elige otra ubicación."); }
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
