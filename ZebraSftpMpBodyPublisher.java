package com.zebra.sendfiletoprinter.sample;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.net.http.HttpRequest;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

public class ZebraSftpMpBodyPublisher {

    private String boundary = UUID.randomUUID().toString();

    private List<String> serialNumberList = new ArrayList<String>(); // At least to have one printer SN
    private Path zplFilePath = null; // Must have one zplFilePath to build the multipart request body.

    public HttpRequest.BodyPublisher build() throws IOException {
        if (serialNumberList.size() == 0) {
            throw new IllegalStateException("Must have at least one printer serial number to build multipart request body.");
        }
        if (zplFilePath == null) {
            throw new IllegalStateException("Must have a ZPL file to build multipart request body.");
        }
        return HttpRequest.BodyPublishers.ofByteArrays(ZebraSftpPartsIterator::new);
    }

    public String getBoundary() {
        return boundary;
    }

    // Add a printer serial number. You can have more than one serial numbers.
    public ZebraSftpMpBodyPublisher addSn(String serialNumber) {
        serialNumberList.add(serialNumber);
        return this;
    }

    public ZebraSftpMpBodyPublisher setZplFilePath(Path zplFilePath) {
        this.zplFilePath = zplFilePath;
        return this;
    }

    class ZebraSftpPartsIterator implements Iterator<byte[]> {

        private Iterator<String> snIter;
        private InputStream zplFileInput;

        private boolean zpl_file_content_done = false;
        private boolean final_boundary_done = false;

        private boolean done;
        private byte[] next;

        ZebraSftpPartsIterator() {
            snIter = serialNumberList.iterator();
        }

        @Override
        public boolean hasNext() {
            if (done)
                return false;
            if (next != null)
                return true;
            try {
                next = calcuNextPart();
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
            if (next == null) {
                done = true;
                return false;
            }
            return true;
        }

        @Override
        public byte[] next() {
            if (!hasNext())
                throw new NoSuchElementException();
            byte[] tmp = next;
            next = null;
            return tmp;
        }

        private byte[] calcuNextPart() throws IOException {

            // First, get the parts for all the serial numbers.
            if (snIter.hasNext()) {
                String snBody = "--" + boundary + "\r\n" + "Content-Disposition: form-data; name=\"sn\"" + "\r\n\r\n" + snIter.next() + "\r\n";
                return snBody.getBytes(StandardCharsets.UTF_8);

            } else if (!zpl_file_content_done) {
                // Done with SN. Then get the part for ZPL file.
                if (zplFileInput == null) {
                    // Open the file input stream
                    zplFileInput = Files.newInputStream(zplFilePath);

                    // Create the header for ZPL file part
                    String contentType = Files.probeContentType(zplFilePath);
                    String zplFileBody = "--" + boundary + "\r\n" + "Content-Disposition: form-data; name=\"zpl_file\"; filename=\"" + zplFilePath.getFileName().toString() + "\"" + "\r\n"
                            + "Content-Type: " + contentType + "\r\n\r\n";
                    return zplFileBody.getBytes(StandardCharsets.UTF_8);
                } else {
                    // Read the file content
                    byte[] bytes = zplFileInput.readAllBytes();
                    zplFileInput.close();
                    zplFileInput = null;
                    byte[] actual = new byte[bytes.length + 2];
                    byte[] newline = "\r\n".getBytes(StandardCharsets.UTF_8); // Ending for the file content part.
                    System.arraycopy(bytes, 0, actual, 0, bytes.length);
                    System.arraycopy(newline, 0, actual, bytes.length, newline.length);
                    zpl_file_content_done = true;
                    return actual;
                }
            } else if (!final_boundary_done) {
                // Add the final boundary
                final_boundary_done = true;
                String finalBoundary = "--" + boundary + "--";
                return finalBoundary.getBytes(StandardCharsets.UTF_8);
            } else {
                // All done
                return null;
            }
        }
    }
}
