const THREAD_KEY = "travel_thread_id";
const REQUEST_TIMEOUT_MS = 180000;

function readStoredThreadId() {
    try {
        return localStorage.getItem(THREAD_KEY) || null;
    } catch {
        return null;
    }
}

function storeThreadId(threadId) {
    try {
        localStorage.setItem(THREAD_KEY, threadId);
    } catch {
        // The current page can still use the thread even when storage is disabled.
    }
}

let currentThreadId = readStoredThreadId();
let latestAnswerMarkdown = "";
let isSending = false;

const $ = (id) => document.getElementById(id);

// Open links from AI answers safely in a new tab
if (typeof DOMPurify !== "undefined") {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
        if (node.tagName === "A" && node.hasAttribute("href")) {
            node.setAttribute("target", "_blank");
            node.setAttribute("rel", "noopener noreferrer");
        }
    });
}

function setPrompt(text) {
    const input = $("userInput");
    input.value = text;
    input.focus();
}

function setLoading(isLoading) {
    const sendBtn = $("sendBtn");

    sendBtn.disabled = isLoading;
    sendBtn.setAttribute("aria-busy", String(isLoading));

    // Keep a text label while loading so the button always has an accessible name
    $("btnText").textContent = isLoading ? "Planning your trip..." : "Generate plan";
    $("btnLoader").classList.toggle("hidden", !isLoading);
}

function showError(message) {
    const errorBox = $("errorBox");
    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    const errorBox = $("errorBox");
    errorBox.classList.add("hidden");
    errorBox.textContent = "";
}

function showResult(answer, threadId) {
    latestAnswerMarkdown = answer;

    if (typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
        $("resultBox").innerHTML = DOMPurify.sanitize(marked.parse(answer));
    } else {
        $("resultBox").textContent = answer;
    }

    $("threadInfo").textContent = `Thread ID: ${threadId}`;
    $("resultSection").classList.remove("hidden");

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    $("resultSection").scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start"
    });
}

async function sendMessage() {
    if (isSending) {
        return;
    }

    hideError();

    const input = $("userInput");
    const message = input.value.trim();

    if (!message) {
        showError("Please enter your travel request first.");
        input.focus();
        return;
    }

    isSending = true;
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const response = await fetch("/api/travel", {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                thread_id: currentThreadId
            })
        });

        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error("The server returned an invalid response. Please try again.");
        }

        if (!data || typeof data !== "object") {
            throw new Error("The server returned an invalid response. Please try again.");
        }

        if (!response.ok || !data.success) {
            throw new Error(
                typeof data.error === "string" && data.error.trim()
                    ? data.error
                    : "The travel plan could not be generated. Please try again."
            );
        }

        if (typeof data.answer !== "string" || typeof data.thread_id !== "string") {
            throw new Error("The server returned an incomplete travel plan. Please try again.");
        }

        currentThreadId = data.thread_id;
        storeThreadId(currentThreadId);

        showResult(data.answer, data.thread_id);

    } catch (error) {
        if (error && error.name === "AbortError") {
            showError("The request timed out. Please try again.");
        } else if (error instanceof TypeError) {
            // fetch() rejects with TypeError when the network or server is unreachable
            showError("Could not reach the server. Check your connection and try again.");
        } else {
            showError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
        }
    } finally {
        clearTimeout(timeoutId);
        isSending = false;
        setLoading(false);
    }
}

async function copyResult() {
    const text = $("resultBox").innerText;

    if (!text) {
        return;
    }

    if (!navigator.clipboard) {
        showError("Clipboard access is unavailable in this browser.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);

        const copyBtn = $("copyBtn");
        const oldText = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setTimeout(() => { copyBtn.textContent = oldText; }, 1400);
    } catch {
        showError("Could not copy result.");
    }
}

async function downloadPDF() {
    const pdfContent = $("pdfContent");

    if (!latestAnswerMarkdown || !pdfContent) {
        showError("No travel plan available to download.");
        return;
    }

    if (typeof html2pdf !== "function") {
        showError("PDF download is unavailable. Please check your connection and try again.");
        return;
    }

    const downloadBtn = $("downloadBtn");
    const oldText = downloadBtn.textContent;

    downloadBtn.textContent = "Preparing PDF...";
    downloadBtn.disabled = true;

    // Show the print-only title and drop the on-screen border during capture
    pdfContent.classList.add("pdf-exporting");

    const options = {
        margin: 0.5,
        filename: "tripmate-travel-plan.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] }
    };

    try {
        await html2pdf().set(options).from(pdfContent).save();
    } catch {
        showError("Could not download PDF.");
    } finally {
        pdfContent.classList.remove("pdf-exporting");
        downloadBtn.textContent = oldText;
        downloadBtn.disabled = false;
    }
}

// Ctrl+Enter (or Cmd+Enter on Mac) sends, but only while typing in the textarea
$("userInput").addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});