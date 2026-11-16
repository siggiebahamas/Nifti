package ph.nifti.app;

import static org.junit.Assert.*;
import org.junit.Test;

public class ParseTest {
    @Test public void kinds() {
        assertEquals("photo", Parse.kind("📷 Photo", null));
        assertEquals("photo", Parse.kind("Photo", null));
        assertEquals("photo", Parse.kind("Sent you a photo", null));
        assertEquals("photo", Parse.kind("📷 Ito na po yung DR", null));
        assertEquals("video", Parse.kind("Video", null));
        assertEquals("voice", Parse.kind("Voice message", null));
        assertEquals("sticker", Parse.kind("Sticker", null));
        assertEquals("file", Parse.kind("File: Invoice-1043.pdf", null));
        assertEquals("file", Parse.kind("📎 SOA October.xlsx", null));
        assertEquals("file", Parse.kind("Invoice 1043.pdf", null));
        assertEquals("text", Parse.kind("Pwede po 20 bags semento bukas?", null));
        assertEquals("text", Parse.kind("Pakisend po yung invoice.pdf mamaya ha, salamat po sa lahat", null));
        assertEquals("text", Parse.kind("Photography class bukas", null));
        assertEquals("photo", Parse.kind("", "image/jpeg"));
        assertEquals("file", Parse.kind("", "application/pdf"));
    }
    @Test public void bodies() {
        assertEquals("", Parse.body("📷 Photo", "photo"));
        assertEquals("Ito na po yung DR", Parse.body("📷 Ito na po yung DR", "photo"));
        assertEquals("", Parse.body("File: Invoice-1043.pdf", "file"));
        assertEquals("Invoice-1043.pdf", Parse.fileName("File: Invoice-1043.pdf"));
        assertEquals("Hello po", Parse.body("Hello po", "text"));
    }
    @Test public void skips() {
        assertTrue(Parse.isSummary("3 new messages"));
        assertTrue(Parse.isSummary("5 messages from 2 chats"));
        assertFalse(Parse.isSummary("3 bags po"));
        assertTrue(Parse.isNoPreview("New message"));
        assertFalse(Parse.isNoPreview("New message po ito"));
        assertTrue(Parse.isTime("9:41 AM"));
        assertTrue(Parse.isTime("21:05"));
        assertTrue(Parse.isDateHeader("Today"));
        assertTrue(Parse.isDateHeader("Nov 16"));
        assertTrue(Parse.isStatusWord("Seen"));
    }
    @Test public void keys() {
        assertEquals(Parse.chatKey("Aling  Nena Store"), Parse.chatKey("aling nena store"));
        long t = 1700000000000L;
        assertEquals(Parse.dkey("t:a", "in", "hi", t), Parse.dkey("t:a", "in", "hi", t + 5000));
        assertNotEquals(Parse.dkey("t:a", "in", "hi", t), Parse.dkey("t:a", "out", "hi", t));
        String[] s = Parse.splitSender("Juan: may stock pa?");
        assertEquals("Juan", s[0]); assertEquals("may stock pa?", s[1]);
    }
}
