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

    @Test public void openChatTimes() {
        java.util.Calendar now = java.util.Calendar.getInstance(); now.set(2026, 10, 16, 15, 0, 0); now.set(java.util.Calendar.MILLISECOND, 0);
        long n = now.getTimeInMillis();
        java.util.Calendar c = java.util.Calendar.getInstance();
        c.setTimeInMillis(Parse.when("Today", "9:41 AM", n));
        assertEquals(9, c.get(java.util.Calendar.HOUR_OF_DAY)); assertEquals(41, c.get(java.util.Calendar.MINUTE)); assertEquals(16, c.get(java.util.Calendar.DAY_OF_MONTH));
        c.setTimeInMillis(Parse.when("Yesterday", "9:05 PM", n));
        assertEquals(21, c.get(java.util.Calendar.HOUR_OF_DAY)); assertEquals(15, c.get(java.util.Calendar.DAY_OF_MONTH));
        c.setTimeInMillis(Parse.when("Nov 14", "12:30 PM", n));
        assertEquals(14, c.get(java.util.Calendar.DAY_OF_MONTH)); assertEquals(12, c.get(java.util.Calendar.HOUR_OF_DAY));
        c.setTimeInMillis(Parse.when("Fri, Nov 13, 2026", "08:00", n));
        assertEquals(13, c.get(java.util.Calendar.DAY_OF_MONTH)); assertEquals(8, c.get(java.util.Calendar.HOUR_OF_DAY));
        c.setTimeInMillis(Parse.when(null, "4:00 PM", n)); // later than now with no date line = yesterday
        assertEquals(15, c.get(java.util.Calendar.DAY_OF_MONTH));
        assertEquals(-1, Parse.when("Today", null, n));
        assertEquals(-1, Parse.when("Someday", "9:00 AM", n));
    }
}
