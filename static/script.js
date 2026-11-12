function readStoredThreadId() {
    try {
        return localStorage.getItem("travel_thread_id") || null;
    } catch {
        return null;
    }
}

function storeThreadId(threadId) {
    try {
        localStorage.setItem("travel_thread_id", threadId);
    } catch {
        // The current page can still use the thread even when storage is disabled.
    }
}

let currentThreadId = readStoredThreadId();
let latestAnswerMarkdown = "";
let isSending = false;

function setPrompt(text) {
    document.getElementById("userInput").value = text;
}

function setLoading(isLoading) {
    const sendBtn = document.getElementById("sendBtn");
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");

    sendBtn.disabled = isLoading;

    if (isLoading) {
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");
    } else {
        btnText.classList.remove("hidden");
        btnLoader.classList.add("hidden");
    }
}

function showError(message) {
    const errorBox = document.getElementById("errorBox");

    errorBox.textContent = message;
    errorBox.classList.remove("hidden");
}

function hideError() {
    const errorBox = document.getElementById("errorBox");

    errorBox.classList.add("hidden");
    errorBox.textContent = "";
}

function showResult(answer, threadId) {
    latestAnswerMarkdown = answer;

    const resultSection = document.getElementById("resultSection");
    const resultBox = document.getElementById("resultBox");
    const threadInfo = document.getElementById("threadInfo");

    if (typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
        resultBox.innerHTML = DOMPurify.sanitize(marked.parse(answer));
    } else {
        resultBox.textContent = answer;
    }

    threadInfo.textContent = `Thread ID: ${threadId}`;

    resultSection.classList.remove("hidden");

    resultSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function sendMessage() {
    if (isSending) {
        return;
    }

    hideError();

    const input = document.getElementById("userInput");
    const message = input.value.trim();

    if (!message) {
        showError("Please enter your travel request first.");
        return;
    }

    isSending = true;
    setLoading(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    try {
        const response = await fetch("/api/travel", {
            method: "POST",
            signal: controller.signal,
            headers: {
                "Content-Type": "application/json"
            },
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
    const resultBox = document.getElementById("resultBox");
    const text = resultBox.innerText;

    if (!text) {
        return;
    }

    if (!navigator.clipboard) {
        showError("Clipboard access is unavailable in this browser.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        const copyBtn = document.querySelector(".copy-btn");
        const oldText = copyBtn.textContent;

        copyBtn.textContent = "Copied!";

        setTimeout(() => {
            copyBtn.textContent = oldText;
        }, 1400);
    } catch {
        showError("Could not copy result.");
    }
}

async function downloadPDF() {
    const pdfContent = document.getElementById("pdfContent");

    if (!latestAnswerMarkdown || !pdfContent) {
        showError("No travel plan available to download.");
        return;
    }

    if (typeof html2pdf !== "function") {
        showError("PDF download is unavailable. Please check your connection and try again.");
        return;
    }

    const downloadBtn = document.querySelector(".download-btn");
    const oldText = downloadBtn.textContent;

    downloadBtn.textContent = "Preparing PDF...";
    downloadBtn.disabled = true;

    const options = {
        margin: 0.5,
        filename: "ai-travel-plan.pdf",
        image: {
            type: "jpeg",
            quality: 0.98
        },
        html2canvas: {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff"
        },
        jsPDF: {
            unit: "in",
            format: "a4",
            orientation: "portrait"
        },
        pagebreak: {
            mode: ["avoid-all", "css", "legacy"]
        }
    };

    try {
        await html2pdf()
            .set(options)
            .from(pdfContent)
            .save();
    } catch {
        showError("Could not download PDF.");
    } finally {
        downloadBtn.textContent = oldText;
        downloadBtn.disabled = false;
    }
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "Enter") {
        sendMessage();
    }
});