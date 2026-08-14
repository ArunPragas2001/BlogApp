// ==========================================
// TOAST & MODAL NOTIFICATION SYSTEM
// ==========================================

function getOrCreateToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }
    return container;
}

/**
 * Display a modern Toast notification
 * @param {string} message - Notification text
 * @param {'success' | 'error' | 'info'} type - Type of toast
 * @param {number} duration - Display time in ms (default 4000ms)
 */
function showToast(message, type = "success", duration = 4000) {
    const container = getOrCreateToastContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconClass = "fa-solid fa-circle-check";
    if (type === "error") iconClass = "fa-solid fa-triangle-exclamation";
    if (type === "info") iconClass = "fa-solid fa-circle-info";

    toast.innerHTML = `
        <i class="${iconClass} toast-icon"></i>
        <div class="toast-message">${escapeToastHTML(message)}</div>
        <button class="toast-close">&times;</button>
    `;

    container.appendChild(toast);

    // Trigger enter animation
    setTimeout(() => toast.classList.add("toast-show"), 10);

    const removeToast = () => {
        toast.classList.remove("toast-show");
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 350);
    };

    toast.querySelector(".toast-close").addEventListener("click", removeToast);
    setTimeout(removeToast, duration);
}

/**
 * Show a modern custom confirmation modal
 */
function showConfirmModal(title, message, onConfirm, isDanger = true) {
    let overlay = document.getElementById("customModalOverlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "customModalOverlay";
        overlay.className = "custom-modal-overlay";
        document.body.appendChild(overlay);
    }

    const iconBadgeClass = isDanger ? "modal-icon-badge danger" : "modal-icon-badge";
    const confirmBtnClass = isDanger ? "btn-modal-confirm danger" : "btn-modal-confirm";
    const iconClass = isDanger ? "fa-solid fa-trash-can" : "fa-solid fa-circle-question";

    overlay.innerHTML = `
        <div class="custom-modal">
            <div class="${iconBadgeClass}">
                <i class="${iconClass}"></i>
            </div>
            <h3>${escapeToastHTML(title)}</h3>
            <p>${escapeToastHTML(message)}</p>
            <div class="modal-actions">
                <button class="btn-modal-cancel" id="btnModalCancel">Cancel</button>
                <button class="${confirmBtnClass}" id="btnModalConfirm">Confirm</button>
            </div>
        </div>
    `;

    overlay.classList.add("active");

    const closeModal = () => {
        overlay.classList.remove("active");
    };

    document.getElementById("btnModalCancel").onclick = () => {
        closeModal();
    };

    document.getElementById("btnModalConfirm").onclick = () => {
        closeModal();
        if (typeof onConfirm === "function") {
            onConfirm();
        }
    };
}

function escapeToastHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Expose functions globally
window.showToast = showToast;
window.showConfirmModal = showConfirmModal;
