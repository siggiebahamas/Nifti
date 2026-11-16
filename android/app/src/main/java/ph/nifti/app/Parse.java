package ph.nifti.app;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Plain text rules for Viber notifications and chat screens. No Android classes, so it can be tested on any computer. */
public final class Parse {
    private Parse() {}

    private static final Pattern PHOTO = Pattern.compile("^(?:\\x{1F4F7}|\\x{1F5BC}\\x{FE0F}?)?\\s*(?:photo|picture|image|larawan|litrato|sent (?:you )?a photo|sent (?:you )?an image)\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern PHOTO_EMOJI = Pattern.compile("^\\s*(?:\\x{1F4F7}|\\x{1F5BC}).*", Pattern.DOTALL);
    private static final Pattern VIDEO = Pattern.compile("^(?:\\x{1F3A5}|\\x{1F4F9})?\\s*(?:video|sent (?:you )?a video)\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern VOICE = Pattern.compile("^(?:\\x{1F3A4})?\\s*(?:voice message|audio message|sent (?:you )?a voice message)\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern STICKER = Pattern.compile("^(?:sticker|sent (?:you )?a sticker|gif)\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern FILE_WORD = Pattern.compile("^(?:\\x{1F4CE}|\\x{1F4C4})?\\s*(?:file|document|sent (?:you )?a file)\\b.*", Pattern.CASE_INSENSITIVE | Pattern.DOTALL);
    private static final Pattern FILE_NAME = Pattern.compile("([\\w\\-. ()\\[\\]#&,']{1,120}\\.(?:pdf|docx?|xlsx?|xlsm|csv|pptx?|zip|rar|txt|odt|ods|heic|jpe?g|png))\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SUMMARY = Pattern.compile("^\\d+\\s+(?:new\\s+)?(?:messages?|mensahe)(?:\\s+(?:from|mula sa)\\s+\\d+\\s+(?:chats?|conversations?))?\\.?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern NO_PREVIEW = Pattern.compile("^(?:new message|you have a new message|1 new message|bagong mensahe|message)\\.?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern TIME = Pattern.compile("^\\d{1,2}:\\d{2}(?:\\s?[APap]\\.?[Mm]\\.?)?$");
    private static final Pattern DATE_HEADER = Pattern.compile("^(?:today|yesterday|ngayon|kahapon|(?:mon|tue|wed|thu|fri|sat|sun)[a-z]*(?:,.*)?|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.? \\d{1,2}(?:, \\d{4})?|\\d{1,2}/\\d{1,2}/\\d{2,4})$", Pattern.CASE_INSENSITIVE);
    private static final Pattern STATUS_WORD = Pattern.compile("^(?:seen|delivered|sent|edited|sending|read|nakita na|naipadala)$", Pattern.CASE_INSENSITIVE);

    /** text, photo, video, file, voice or sticker */
    public static String kind(String text, String mime) {
        if (mime != null) {
            String m = mime.toLowerCase(Locale.ROOT);
            if (m.startsWith("image/")) return "photo";
            if (m.startsWith("video/")) return "video";
            if (m.startsWith("audio/")) return "voice";
            if (!m.startsWith("text/")) return "file";
        }
        String t = text == null ? "" : text.trim();
        if (t.isEmpty()) return "text";
        if (PHOTO.matcher(t).matches() || PHOTO_EMOJI.matcher(t).matches()) return "photo";
        if (VIDEO.matcher(t).matches()) return "video";
        if (VOICE.matcher(t).matches()) return "voice";
        if (STICKER.matcher(t).matches()) return "sticker";
        if (FILE_WORD.matcher(t).matches()) return "file";
        // a lone file name like "Invoice 1043.pdf"
        Matcher fm = FILE_NAME.matcher(t);
        if (fm.find() && fm.group(1).length() >= t.length() - 8) return "file";
        return "text";
    }

    /** The words the person typed, without Viber's "Photo" / "File" label. Empty when there were none. */
    public static String body(String text, String kind) {
        String t = text == null ? "" : text.trim();
        if ("text".equals(kind)) return t;
        String s = t.replaceFirst("^(?:\\x{1F4F7}|\\x{1F5BC}\\x{FE0F}?|\\x{1F3A5}|\\x{1F4F9}|\\x{1F3A4}|\\x{1F4CE}|\\x{1F4C4})\\s*", "");
        s = s.replaceFirst("(?i)^(?:sent (?:you )?(?:a|an) (?:photo|image|video|file|voice message|sticker)|photo|picture|image|larawan|litrato|video|voice message|audio message|sticker|gif|file|document)\\s*[:\\-]?\\s*", "");
        if ("file".equals(kind)) {
            String n = fileName(t);
            if (n != null && s.trim().equalsIgnoreCase(n)) return "";
        }
        return s.trim();
    }

    public static String fileName(String text) {
        if (text == null) return null;
        Matcher m = FILE_NAME.matcher(text);
        return m.find() ? m.group(1).trim() : null;
    }

    public static boolean isSummary(String text) { return text != null && SUMMARY.matcher(text.trim()).matches(); }
    public static boolean isNoPreview(String text) { return text != null && NO_PREVIEW.matcher(text.trim()).matches(); }
    public static boolean isTime(String text) { return text != null && TIME.matcher(text.trim()).matches(); }
    public static boolean isDateHeader(String text) { return text != null && DATE_HEADER.matcher(text.trim()).matches(); }
    public static boolean isStatusWord(String text) { return text != null && STATUS_WORD.matcher(text.trim()).matches(); }

    private static final String[] MONTHS = {"jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"};
    private static final String[] DAYS = {"sun", "mon", "tue", "wed", "thu", "fri", "sat"};
    private static final Pattern MD = Pattern.compile("^([a-z]{3})[a-z]*\\.?\\s+(\\d{1,2})(?:,?\\s+(\\d{4}))?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern DM = Pattern.compile("^(\\d{1,2})\\s+([a-z]{3})[a-z]*\\.?(?:,?\\s+(\\d{4}))?$", Pattern.CASE_INSENSITIVE);
    private static final Pattern HM = Pattern.compile("^(\\d{1,2}):(\\d{2})\\s?([ap])?\\.?\\s?m?\\.?$", Pattern.CASE_INSENSITIVE);

    /**
     * When a message in an open Viber chat was sent, from the date line above it ("Today", "Yesterday", "Mon", "Nov 14")
     * and the time in its bubble ("9:41 AM"). -1 when the screen doesn't say.
     */
    public static long when(String day, String time, long nowMs) {
        if (time == null) return -1;
        Matcher hm = HM.matcher(time.trim());
        if (!hm.matches()) return -1;
        int h = Integer.parseInt(hm.group(1)), m = Integer.parseInt(hm.group(2));
        String ap = hm.group(3);
        if (ap != null) { boolean pm = ap.equalsIgnoreCase("p"); if (h == 12) h = pm ? 12 : 0; else if (pm) h += 12; }
        if (h > 23 || m > 59) return -1;
        java.util.Calendar now = java.util.Calendar.getInstance(); now.setTimeInMillis(nowMs);
        java.util.Calendar c = (java.util.Calendar) now.clone();
        c.set(java.util.Calendar.HOUR_OF_DAY, h); c.set(java.util.Calendar.MINUTE, m); c.set(java.util.Calendar.SECOND, 0); c.set(java.util.Calendar.MILLISECOND, 0);
        String d = day == null ? "" : day.trim().toLowerCase(Locale.ROOT);
        if (d.isEmpty()) { if (c.getTimeInMillis() > nowMs + 60000) c.add(java.util.Calendar.DAY_OF_MONTH, -1); return c.getTimeInMillis(); }
        if (d.startsWith("today") || d.startsWith("ngayon")) return c.getTimeInMillis();
        if (d.startsWith("yesterday") || d.startsWith("kahapon")) { c.add(java.util.Calendar.DAY_OF_MONTH, -1); return c.getTimeInMillis(); }
        for (int i = 0; i < 7; i++) if (d.startsWith(DAYS[i]) && !d.matches(".*\\d.*")) {
            int back = (now.get(java.util.Calendar.DAY_OF_WEEK) - 1 - i + 7) % 7; if (back == 0) back = 7;
            c.add(java.util.Calendar.DAY_OF_MONTH, -back); return c.getTimeInMillis();
        }
        String rest = d.replaceFirst("^(sun|mon|tue|wed|thu|fri|sat)[a-z]*,?\\s*", "");
        Matcher md = MD.matcher(rest), dm = DM.matcher(rest);
        String mon = null, dd = null, yy = null;
        if (md.matches()) { mon = md.group(1); dd = md.group(2); yy = md.group(3); }
        else if (dm.matches()) { dd = dm.group(1); mon = dm.group(2); yy = dm.group(3); }
        if (mon == null) return -1;
        int mi = -1; for (int i = 0; i < 12; i++) if (MONTHS[i].equalsIgnoreCase(mon)) mi = i;
        if (mi < 0) return -1;
        c.set(java.util.Calendar.MONTH, mi); c.set(java.util.Calendar.DAY_OF_MONTH, Integer.parseInt(dd));
        if (yy != null) c.set(java.util.Calendar.YEAR, Integer.parseInt(yy));
        else if (c.getTimeInMillis() > nowMs + 86400000L) c.add(java.util.Calendar.YEAR, -1);
        return c.getTimeInMillis();
    }

    public static boolean needsMedia(String kind) { return "photo".equals(kind) || "video".equals(kind) || "file".equals(kind); }

    /** One chat = one key, made from its name as Viber shows it. */
    public static String chatKey(String title) {
        String t = title == null ? "" : title.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return "t:" + (t.length() > 150 ? t.substring(0, 150) : t);
    }

    /** "Juan: hello" in a group notification without a sender field */
    public static String[] splitSender(String text) {
        if (text == null) return new String[]{null, ""};
        int i = text.indexOf(": ");
        if (i > 0 && i < 40 && !text.substring(0, i).contains("http")) return new String[]{text.substring(0, i).trim(), text.substring(i + 2)};
        return new String[]{null, text};
    }

    /** Same message seen again (Viber re-posts the whole conversation each time) gets the same key. */
    public static String dkey(String chatKey, String dir, String text, long timeMillis) {
        long minute = timeMillis / 60000L;
        return sha(chatKey + "|" + dir + "|" + (text == null ? "" : text.trim()) + "|" + minute).substring(0, 32);
    }

    public static String sha(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] h = md.digest(s.getBytes(StandardCharsets.UTF_8));
            StringBuilder b = new StringBuilder();
            for (byte x : h) b.append(String.format(Locale.ROOT, "%02x", x));
            return b.toString();
        } catch (Exception e) {
            return Integer.toHexString(s.hashCode()) + "00000000000000000000000000000000";
        }
    }
}
