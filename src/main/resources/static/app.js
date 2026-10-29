"use strict";

const form = document.querySelector("#translation-form");
const message = document.querySelector("#message");
const language = document.querySelector("#language");
const microphone = document.querySelector("#microphone");
const stopMicrophone = document.querySelector("#stop-microphone");
const clearButton = document.querySelector("#clear");
const translateButton = document.querySelector("#translate");
const translation = document.querySelector("#translation");
const status = document.querySelector("#status");
const strings = {
  blank: "Please type or speak some text first.",
  translating: "Translating ...",
  complete: "Translation ready.",
  serverError: "Translation failed: the server returned HTTP {code}.",
  emptyResponse: "The server returned no translation.",
  requestError: "Translation failed. Check your connection and try again.",
  timeout: "Translation took too long. Please try again.",
  listening: "Please speak now ...",
  microphoneError: "Could not start the microphone. Check its permission and try again.",
  speechError: "Speech recognition failed. Try again or type your text.",
  permissionError: "Microphone access was denied. Check your browser permissions or type your text.",
  speechNetworkError: "The speech recognition service is unavailable. Check your connection or type your text.",
  speechLanguageError: "Speech recognition does not support this language. Please type your text.",
  noSpeech: "No speech detected. Try again or type your text.",
  unavailable: "Microphone unavailable. Use a browser with speech recognition on HTTPS or localhost. You can still type your text."
};
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const canRecord = Boolean(SpeechRecognition) && window.isSecureContext;
let recording = false;
let translating = false;

function showStatus(key, error = false, values = {}) {
  status.textContent = strings[key].replace(
    /\{(\w+)\}/g, (_, name) => String(values[name])
  );
  status.dataset.error = String(error);
}

message.addEventListener("invalid", () => {
  message.setCustomValidity(strings.blank);
});
message.addEventListener("input", () => message.setCustomValidity(""));

function updateControls() {
  const busy = recording || translating;
  microphone.disabled = busy || !canRecord;
  stopMicrophone.disabled = !recording;
  clearButton.disabled = busy;
  translateButton.disabled = busy;
  language.disabled = busy;
  message.disabled = busy;
  form.setAttribute("aria-busy", String(busy));
}

async function translate() {
  if (recording || translating) return;
  const text = message.value.trim();
  if (!text) {
    showStatus("blank", true);
    return;
  }

  translating = true;
  updateControls();
  translation.textContent = "";
  showStatus("translating");

  try {
    const response = await fetch("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
      body: text,
      signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) {
      showStatus("serverError", true, { code: response.status });
      return;
    }
    const result = await response.text();
    if (!result.trim()) {
      showStatus("emptyResponse", true);
      return;
    }
    translation.textContent = result;
    showStatus("complete");
  } catch (error) {
    showStatus(error.name === "TimeoutError" ? "timeout" : "requestError", true);
  } finally {
    translating = false;
    updateControls();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  translate();
});

clearButton.addEventListener("click", () => {
  if (recording || translating) return;
  message.value = "";
  message.setCustomValidity("");
  translation.textContent = "";
  status.textContent = "";
  status.dataset.error = "false";
  message.focus();
});

if (canRecord) {
  const recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.continuous = false;
  let recognizedText = "";
  let recognitionFailed = false;
  let stopping = false;
  let recordingTimer;

  function stopRecording() {
    if (!recording || stopping) return;
    stopping = true;
    clearTimeout(recordingTimer);
    stopMicrophone.disabled = true;
    recognition.stop();
  }

  stopMicrophone.addEventListener("click", stopRecording);

  microphone.addEventListener("click", () => {
    if (recording || translating) return;
    recognition.lang = language.value;
    recognizedText = "";
    recognitionFailed = false;
    stopping = false;
    recording = true;
    updateControls();
    message.setCustomValidity("");
    showStatus("listening");
    try {
      recognition.start();
      recordingTimer = setTimeout(stopRecording, 15000);
    } catch (error) {
      recording = false;
      updateControls();
      showStatus("microphoneError", true);
    }
  });

  recognition.onresult = (event) => {
    recognizedText = event.results[0][0].transcript;
    message.value = recognizedText;
    stopRecording();
  };

  recognition.onspeechend = stopRecording;

  recognition.onerror = (event) => {
    clearTimeout(recordingTimer);
    recognitionFailed = true;
    recognition.abort();
    const errorKeys = {
      "not-allowed": "permissionError",
      "service-not-allowed": "permissionError",
      "audio-capture": "microphoneError",
      "network": "speechNetworkError",
      "language-not-supported": "speechLanguageError",
      "no-speech": "noSpeech"
    };
    showStatus(errorKeys[event.error] || "speechError", true);
  };

  recognition.onend = () => {
    clearTimeout(recordingTimer);
    recording = false;
    updateControls();
    if (recognitionFailed) return;
    if (recognizedText.trim()) {
      translate();
    } else {
      showStatus("noSpeech", true);
    }
  };

  window.addEventListener("pagehide", () => {
    clearTimeout(recordingTimer);
    recognitionFailed = true;
    if (recording) recognition.abort();
  });
} else {
  showStatus("unavailable");
}

updateControls();
