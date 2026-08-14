function getOrCreateToastContainer() {
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
    }
    return container;
}

function showToast(message, type, duration) {
    if (duration === undefined) duration = 5000;
    if (!type) type = "success";

    const container = getOrCreateToastContainer();

    const toast = document.createElement("div");
    toast.className = "toast toast-" + type;

    let iconClass = "fa-solid fa-circle-check";
    if (type === "error") iconClass = "fa-solid fa-triangle-exclamation";
    if (type === "info") iconClass = "fa-solid fa-circle-info";

    toast.innerHTML = '<i class="' + iconClass + ' toast-icon"></i><div class="toast-message">' + String(message) + '</div><button class="toast-close" aria-label="Close">&times;</button>';

    container.appendChild(toast);

    setTimeout(function () { toast.classList.add("toast-show"); }, 10);

    function removeToast() {
        toast.classList.remove("toast-show");
        setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 400);
    }

    toast.querySelector(".toast-close").addEventListener("click", removeToast);
    setTimeout(removeToast, duration);
}

function showConfirmModal(title, message, onConfirm, isDanger) {
    if (isDanger === undefined) isDanger = true;

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

    const safeMsg = String(message || "").replace(/\n/g, "<br>");

    overlay.innerHTML = '<div class="custom-modal">' +
        '<div class="' + iconBadgeClass + '"><i class="' + iconClass + '"></i></div>' +
        '<h3>' + String(title || "") + '</h3>' +
        '<p>' + safeMsg + '</p>' +
        '<div class="modal-actions">' +
        '<button class="btn-modal-cancel" id="btnModalCancel">Cancel</button>' +
        '<button class="' + confirmBtnClass + '" id="btnModalConfirm">Confirm</button>' +
        '</div></div>';

    overlay.classList.add("active");

    function closeModal() {
        overlay.classList.remove("active");
    }

    document.getElementById("btnModalCancel").onclick = closeModal;
    document.getElementById("btnModalConfirm").onclick = function () {
        closeModal();
        if (typeof onConfirm === "function") onConfirm();
    };

    overlay.addEventListener("click", function (e) {
        if (e.target === overlay) closeModal();
    });
}

window.showToast = showToast;
window.showConfirmModal = showConfirmModal;
