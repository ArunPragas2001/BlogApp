/**
 * BlogSphere Share Helper Utility
 * Handles multi-channel blog sharing across WhatsApp, Facebook, Instagram, X/Twitter, Telegram, LinkedIn, Copy Link, and Web Share API.
 */

(function (window) {
    'use strict';

    function esc(str) {
        if (!str) return "";
        return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }

    function getBlogShareUrl(blogId) {
        if (!blogId) return window.location.href;
        var origin = window.location.origin;
        var pathname = window.location.pathname;

        // Ensure path leads to index.html where article reader lives
        var basePath = pathname.substring(0, pathname.lastIndexOf('/') + 1);
        if (!basePath.endsWith('/')) basePath += '/';

        return origin + basePath + 'index.html?blogId=' + encodeURIComponent(String(blogId));
    }

    function findBlogData(blogId) {
        if (typeof blogId === 'object' && blogId !== null) return blogId;

        var idStr = String(blogId);
        if (window.cachedBlogs && Array.isArray(window.cachedBlogs)) {
            var found = window.cachedBlogs.find(function (b) { return String(b._id || b.id) === idStr; });
            if (found) return found;
        }
        if (window.allBlogs && Array.isArray(window.allBlogs)) {
            var foundDash = window.allBlogs.find(function (b) { return String(b._id || b.id) === idStr; });
            if (foundDash) return foundDash;
        }
        return { _id: idStr, title: "Blog Post", category: "Article" };
    }

    // ─── Individual Sharing Methods ──────────────────────────────────────────

    function shareToWhatsApp(blogId, title) {
        var url = getBlogShareUrl(blogId);
        var blogText = title ? title : "Check out this article on BlogSphere";
        var shareText = blogText + "\n" + url;
        var waUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(shareText);
        window.open(waUrl, "_blank", "noopener,noreferrer");
    }

    function shareToFacebook(blogId) {
        var url = getBlogShareUrl(blogId);
        var fbUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
        window.open(fbUrl, "fbShare", "width=600,height=500,location=no,menubar=no,status=no,toolbar=no");
    }

    function shareToInstagram(blogId, title) {
        var url = getBlogShareUrl(blogId);
        var textToCopy = (title ? title + " - " : "") + url;

        copyTextToClipboard(url).then(function (success) {
            if (typeof window.showToast === 'function') {
                window.showToast("📸 Link copied! Opening Instagram...", "info", 3000);
            }
            setTimeout(function () {
                window.open("https://www.instagram.com", "_blank", "noopener,noreferrer");
            }, 800);
        }).catch(function () {
            promptUserCopy(url, "Instagram link");
        });
    }

    function shareToTwitter(blogId, title) {
        var url = getBlogShareUrl(blogId);
        var blogText = title ? title : "Check out this article on BlogSphere";
        var twitterUrl = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(blogText) + "&url=" + encodeURIComponent(url);
        window.open(twitterUrl, "twShare", "width=600,height=450,location=no,menubar=no,status=no,toolbar=no");
    }

    function shareToTelegram(blogId, title) {
        var url = getBlogShareUrl(blogId);
        var blogText = title ? title : "Check out this article on BlogSphere";
        var tgUrl = "https://t.me/share/url?url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(blogText);
        window.open(tgUrl, "tgShare", "width=600,height=500,location=no,menubar=no,status=no,toolbar=no");
    }

    function shareToLinkedIn(blogId, title) {
        var url = getBlogShareUrl(blogId);
        var liUrl = "https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url);
        window.open(liUrl, "liShare", "width=600,height=550,location=no,menubar=no,status=no,toolbar=no");
    }

    function copyTextToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            return new Promise(function (resolve, reject) {
                var textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    var successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (successful) resolve(); else reject();
                } catch (err) {
                    document.body.removeChild(textArea);
                    reject(err);
                }
            });
        }
    }

    function promptUserCopy(text, label) {
        window.prompt("Copy " + (label || "link") + ":", text);
    }

    function copyBlogLink(blogId, btnElement) {
        var url = getBlogShareUrl(blogId);
        copyTextToClipboard(url).then(function () {
            if (typeof window.showToast === 'function') {
                window.showToast("✨ Blog link copied to clipboard!", "success", 2500);
            }
            if (btnElement) {
                var originalHtml = btnElement.innerHTML;
                btnElement.classList.add("copied");
                btnElement.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                setTimeout(function () {
                    btnElement.classList.remove("copied");
                    btnElement.innerHTML = originalHtml;
                }, 2000);
            }
        }).catch(function () {
            promptUserCopy(url, "Blog Link");
        });
    }

    function triggerNativeShare(blogId, title, content) {
        var url = getBlogShareUrl(blogId);
        if (navigator.share) {
            navigator.share({
                title: title || 'BlogSphere Article',
                text: content ? content.substring(0, 120) + '…' : 'Read on BlogSphere',
                url: url
            }).catch(function (err) {
                if (err.name !== 'AbortError') {
                    console.warn("Native share error:", err);
                }
            });
        } else {
            copyBlogLink(blogId);
        }
    }

    // ─── Share Modal Component ───────────────────────────────────────────────

    function closeShareModal() {
        var overlay = document.getElementById("blogShareModalOverlay");
        if (overlay) {
            overlay.classList.remove("active");
            setTimeout(function () {
                overlay.style.display = "none";
            }, 300);
        }
        document.body.style.overflow = "";
    }

    function openShareModal(blogOrId) {
        var blog = findBlogData(blogOrId);
        var blogId = blog._id || blog.id || blogOrId;
        var blogTitle = blog.title || "Blog Post";
        var blogCategory = blog.category || "General";
        var shareUrl = getBlogShareUrl(blogId);

        var overlay = document.getElementById("blogShareModalOverlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.id = "blogShareModalOverlay";
            overlay.className = "share-modal-overlay";
            document.body.appendChild(overlay);
        }

        var isNativeShareSupported = !!navigator.share;

        overlay.innerHTML =
            '<div class="share-modal-card" id="shareModalCard">' +
            '  <div class="share-modal-header">' +
            '    <div class="share-modal-title-wrap">' +
            '      <div class="share-icon-badge"><i class="fa-solid fa-share-nodes"></i></div>' +
            '      <div>' +
            '        <h3 class="share-modal-heading">Share Article</h3>' +
            '        <p class="share-modal-subheading">Spread the word across your favorite networks</p>' +
            '      </div>' +
            '    </div>' +
            '    <button class="share-modal-close" id="shareModalCloseBtn" aria-label="Close share dialog">&times;</button>' +
            '  </div>' +
            '  <div class="share-modal-body">' +
            '    <div class="share-blog-preview">' +
            '      <span class="share-blog-cat">' + esc(blogCategory) + '</span>' +
            '      <h4 class="share-blog-title">' + esc(blogTitle) + '</h4>' +
            '    </div>' +
            '    <div class="share-networks-grid">' +
            '      <button class="share-net-btn wa" onclick="BlogShare.whatsapp(\'' + blogId + '\', \'' + esc(blogTitle).replace(/'/g, "\\'") + '\')">' +
            '        <div class="net-icon"><i class="fa-brands fa-whatsapp"></i></div>' +
            '        <span>WhatsApp</span>' +
            '      </button>' +
            '      <button class="share-net-btn fb" onclick="BlogShare.facebook(\'' + blogId + '\')">' +
            '        <div class="net-icon"><i class="fa-brands fa-facebook-f"></i></div>' +
            '        <span>Facebook</span>' +
            '      </button>' +
            '      <button class="share-net-btn insta" onclick="BlogShare.instagram(\'' + blogId + '\', \'' + esc(blogTitle).replace(/'/g, "\\'") + '\')">' +
            '        <div class="net-icon"><i class="fa-brands fa-instagram"></i></div>' +
            '        <span>Instagram</span>' +
            '      </button>' +
            '      <button class="share-net-btn tw" onclick="BlogShare.twitter(\'' + blogId + '\', \'' + esc(blogTitle).replace(/'/g, "\\'") + '\')">' +
            '        <div class="net-icon"><i class="fa-brands fa-x-twitter"></i></div>' +
            '        <span>X (Twitter)</span>' +
            '      </button>' +
            '      <button class="share-net-btn tg" onclick="BlogShare.telegram(\'' + blogId + '\', \'' + esc(blogTitle).replace(/'/g, "\\'") + '\')">' +
            '        <div class="net-icon"><i class="fa-brands fa-telegram"></i></div>' +
            '        <span>Telegram</span>' +
            '      </button>' +
            '      <button class="share-net-btn li" onclick="BlogShare.linkedin(\'' + blogId + '\', \'' + esc(blogTitle).replace(/'/g, "\\'") + '\')">' +
            '        <div class="net-icon"><i class="fa-brands fa-linkedin-in"></i></div>' +
            '        <span>LinkedIn</span>' +
            '      </button>' +
                   (isNativeShareSupported ?
            '      <button class="share-net-btn native" onclick="BlogShare.native(\'' + blogId + '\', \'' + esc(blogTitle).replace(/'/g, "\\'") + '\')">' +
            '        <div class="net-icon"><i class="fa-solid fa-arrow-up-from-bracket"></i></div>' +
            '        <span>More...</span>' +
            '      </button>' : '') +
            '    </div>' +
            '    <div class="share-copy-box">' +
            '      <label class="share-copy-label"><i class="fa-solid fa-link"></i> Direct Article Link</label>' +
            '      <div class="share-copy-input-wrap">' +
            '        <input type="text" class="share-copy-input" value="' + esc(shareUrl) + '" readonly id="shareCopyUrlInput" onclick="this.select()">' +
            '        <button class="share-copy-btn" id="shareCopyBtn" onclick="BlogShare.copy(\'' + blogId + '\', this)">' +
            '          <i class="fa-regular fa-copy"></i> Copy' +
            '        </button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        overlay.style.display = "flex";
        setTimeout(function () {
            overlay.classList.add("active");
        }, 10);
        document.body.style.overflow = "hidden";

        var closeBtn = document.getElementById("shareModalCloseBtn");
        if (closeBtn) closeBtn.onclick = closeShareModal;

        overlay.onclick = function (e) {
            if (e.target === overlay) closeShareModal();
        };
    }

    // Close on Escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeShareModal();
        }
    });

    // ─── Export Global API ───────────────────────────────────────────────────

    window.BlogShare = {
        getUrl: getBlogShareUrl,
        whatsapp: shareToWhatsApp,
        facebook: shareToFacebook,
        instagram: shareToInstagram,
        twitter: shareToTwitter,
        telegram: shareToTelegram,
        linkedin: shareToLinkedIn,
        copy: copyBlogLink,
        native: triggerNativeShare,
        openModal: openShareModal,
        closeModal: closeShareModal
    };

    window.openShareModalById = openShareModal;

})(window);
