import java.io.InputStream;
import java.nio.file.Path;
import java.security.CodeSigner;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Locale;
import java.util.jar.JarFile;

/** Verify every payload entry and pin the signing certificate; an unsigned JAR is rejected. */
class VerifyBundleSignature {
    public static void main(String[] args) throws Exception {
        if (args.length != 2 || !args[1].matches("[0-9a-f]{64}"))
            throw new IllegalArgumentException("Uso: VerifyBundleSignature archivo.aab sha256");
        int payloads = 0;
        try (JarFile bundle = new JarFile(Path.of(args[0]).toFile(), true)) {
            var entries = bundle.entries();
            while (entries.hasMoreElements()) {
                var entry = entries.nextElement();
                String name = entry.getName().toUpperCase(Locale.ROOT);
                if (entry.isDirectory() || name.equals("META-INF/MANIFEST.MF") ||
                    name.matches("META-INF/[^/]+\\.(SF|RSA|DSA|EC)")) continue;
                try (InputStream stream = bundle.getInputStream(entry)) {
                    stream.transferTo(java.io.OutputStream.nullOutputStream());
                } // Reading to EOF makes JarFile verify the entry digest and signature.
                CodeSigner[] signers = entry.getCodeSigners();
                if (signers == null || signers.length != 1)
                    throw new SecurityException("Entrada sin firma única: " + entry.getName());
                byte[] certificate = signers[0].getSignerCertPath().getCertificates().get(0).getEncoded();
                String fingerprint = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(certificate));
                if (!fingerprint.equals(args[1]))
                    throw new SecurityException("El certificado del AAB no coincide con el fijado.");
                payloads++;
            }
        }
        if (payloads == 0) throw new SecurityException("El AAB no contiene entradas firmadas.");
        System.out.println("AAB: integridad y certificado verificados en " + payloads + " entradas.");
        System.out.println("Certificado SHA-256: " + args[1]);
    }
}
