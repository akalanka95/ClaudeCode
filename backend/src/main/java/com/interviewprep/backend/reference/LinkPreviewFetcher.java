package com.interviewprep.backend.reference;

import java.net.InetAddress;
import java.net.URI;
import java.net.UnknownHostException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Best-effort, server-side fetch of a link's title/description/image so the browser never has to
 * hit an arbitrary third-party site directly (which CORS would block anyway). Every failure mode
 * (unreachable host, timeout, non-HTML response, blocked scrape) degrades to {@link LinkPreview#EMPTY}
 * rather than failing the reference-material create — the preview is a nice-to-have, not a
 * requirement. Redirects are not followed, and the target host is checked against loopback/
 * private/link-local ranges before connecting, as a baseline guard against the server being used
 * to probe internal network addresses (SSRF).
 */
@Component
public class LinkPreviewFetcher {

    private static final Logger log = LoggerFactory.getLogger(LinkPreviewFetcher.class);
    private static final int TIMEOUT_MILLIS = 5000;
    private static final int MAX_BODY_BYTES = 1_048_576;

    public LinkPreview fetch(String url) {
        try {
            URI uri = new URI(url);
            if (!isSafeToFetch(uri)) {
                return LinkPreview.EMPTY;
            }
            Document doc = Jsoup.connect(url)
                    .timeout(TIMEOUT_MILLIS)
                    .maxBodySize(MAX_BODY_BYTES)
                    .followRedirects(false)
                    .userAgent("Mozilla/5.0 (compatible; InterviewPrepBot/1.0)")
                    .get();
            return extract(doc);
        } catch (Exception e) {
            log.debug("Link preview fetch failed for {}: {}", url, e.toString());
            return LinkPreview.EMPTY;
        }
    }

    private boolean isSafeToFetch(URI uri) {
        String scheme = uri.getScheme();
        if (scheme == null || !("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
            return false;
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            return false;
        }
        try {
            InetAddress address = InetAddress.getByName(host);
            return !(address.isLoopbackAddress()
                    || address.isSiteLocalAddress()
                    || address.isLinkLocalAddress()
                    || address.isAnyLocalAddress()
                    || address.isMulticastAddress());
        } catch (UnknownHostException e) {
            return false;
        }
    }

    private LinkPreview extract(Document doc) {
        String title = firstNonBlank(
                metaText(doc, "meta[property=og:title]"),
                metaText(doc, "meta[name=twitter:title]"),
                doc.title());
        String description = firstNonBlank(
                metaText(doc, "meta[property=og:description]"),
                metaText(doc, "meta[name=twitter:description]"),
                metaText(doc, "meta[name=description]"));
        String imageUrl = firstNonBlank(
                metaUrl(doc, "meta[property=og:image]"),
                metaUrl(doc, "meta[name=twitter:image]"),
                faviconUrl(doc));
        return new LinkPreview(title, description, imageUrl);
    }

    private String metaText(Document doc, String cssSelector) {
        Element el = doc.selectFirst(cssSelector);
        return el != null ? el.attr("content") : null;
    }

    private String metaUrl(Document doc, String cssSelector) {
        Element el = doc.selectFirst(cssSelector);
        return el != null ? el.absUrl("content") : null;
    }

    private String faviconUrl(Document doc) {
        Element icon = doc.selectFirst("link[rel~=(?i)icon]");
        String href = icon != null ? icon.absUrl("href") : null;
        if (href != null && !href.isBlank()) {
            return href;
        }
        String base = doc.location();
        try {
            URI baseUri = new URI(base);
            return baseUri.getScheme() + "://" + baseUri.getAuthority() + "/favicon.ico";
        } catch (Exception e) {
            return null;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
