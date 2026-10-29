"use strict";

const form = document.querySelector("#translation-form");
const message = document.querySelector("#message");
const language = document.querySelector("#language");
const microphone = document.querySelector("#microphone");
const translateButton = document.querySelector("#translate");
const translation = document.querySelector("#translation");
const status = document.querySelector("#status");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const canRecord = Boolean(SpeechRecognition) && window.isSecureContext;
let recording = false;
let translating = false;

function showStatus(text, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
}

function updateControls() {
  const busy = recording || translating;
  microphone.disabled = busy || !canRecord;
  translateButton.disabled = busy;
  language.disabled = busy;
  message.disabled = busy;
  form.setAttribute("aria-busy", String(busy));
}

async function translate() {
  if (recording || translating) return;
  const text = message.value.trim();
  if (!text) {
    showStatus("Bitte zuerst einen Text eingeben oder sprechen.", true);
    return;
  }

  translating = true;
  updateControls();
  translation.textContent = "";
  showStatus("Wird uebersetzt ...");

  try {
    const response = await fetch("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
      body: text,
      signal: AbortSignal.timeout(60000)
    });
    if (!response.ok) {
      throw new Error(`Server meldet HTTP ${response.status}.`);
    }
    const result = await response.text();
    if (!result.trim()) {
      throw new Error("Der Server hat keine Uebersetzung geliefert.");
    }
    translation.textContent = result;
    showStatus("Uebersetzung fertig.");
  } catch (error) {
    showStatus(`Uebersetzung fehlgeschlagen: ${error.message}`, true);
  } finally {
    translating = false;
    updateControls();
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  translate();
});

if (canRecord) {
  const recognition = new SpeechRecognition();
  recognition.interimResults = false;
  recognition.continuous = false;
  let recognizedText = "";
  let recognitionFailed = false;

  microphone.addEventListener("click", () => {
    if (recording || translating) return;
    recognition.lang = language.value;
    recognizedText = "";
    recognitionFailed = false;
    recording = true;
    updateControls();
    showStatus("Bitte jetzt sprechen ...");
    try {
      recognition.start();
    } catch (error) {
      recording = false;
      updateControls();
      showStatus(`Mikrofon konnte nicht starten: ${error.message}`, true);
    }
  });

  recognition.onresult = (event) => {
    recognizedText = event.results[0][0].transcript;
    message.value = recognizedText;
  };

  recognition.onerror = (event) => {
    recognitionFailed = true;
    showStatus(`Spracherkennung fehlgeschlagen: ${event.error}. Du kannst den Text weiterhin tippen.`, true);
  };

  recognition.onend = () => {
    recording = false;
    updateControls();
    if (recognitionFailed) return;
    if (recognizedText.trim()) {
      translate();
    } else {
      showStatus("Keine Sprache erkannt. Bitte erneut versuchen oder Text eingeben.", true);
    }
  };
} else {
  showStatus("Mikrofon nicht verfuegbar. Nutze einen Browser mit Spracherkennung auf HTTPS oder localhost. Texteingabe funktioniert weiterhin.");
}

updateControls();
