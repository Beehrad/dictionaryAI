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
const uiLanguage = document.querySelector("#ui-language");
const strings = {
  de: {
    uiLanguage: "Seitensprache",
    title: "Deutsch ↔ Persisch",
    intro: "Schreibe oder sprich deinen Text. Die Zielsprache wird automatisch erkannt.",
    message: "Dein Text",
    placeholder: "Text auf Deutsch oder Persisch eingeben",
    speechLanguage: "Sprache für das Mikrofon",
    german: "Deutsch",
    persian: "Persisch",
    speak: "Sprechen",
    stop: "Aufnahme stoppen",
    clear: "Leeren",
    translate: "Übersetzen",
    translation: "Übersetzung",
    attribution: "Powered by Behrad",
    privacy: "Mikrofonzugriff benötigt HTTPS oder localhost und einen unterstützten Browser. Je nach Browser wird deine Sprache von einem externen Dienst verarbeitet. Nur der erkannte Text geht an diese App.",
    blank: "Bitte zuerst einen Text eingeben oder sprechen.",
    translating: "Wird übersetzt ...",
    complete: "Übersetzung fertig.",
    serverError: "Übersetzung fehlgeschlagen: Server meldet HTTP {code}.",
    emptyResponse: "Der Server hat keine Übersetzung geliefert.",
    requestError: "Übersetzung fehlgeschlagen. Prüfe deine Verbindung und versuche es erneut.",
    timeout: "Die Übersetzung dauert zu lange. Bitte erneut versuchen.",
    listening: "Bitte jetzt sprechen ...",
    microphoneError: "Mikrofon konnte nicht starten. Prüfe die Berechtigung und versuche es erneut.",
    speechError: "Spracherkennung fehlgeschlagen. Bitte erneut versuchen oder Text eingeben.",
    permissionError: "Mikrofonzugriff nicht erlaubt. Prüfe die Berechtigung im Browser oder gib Text ein.",
    speechNetworkError: "Der Spracherkennungsdienst ist nicht erreichbar. Prüfe deine Verbindung oder gib Text ein.",
    speechLanguageError: "Diese Sprache wird von der Spracherkennung nicht unterstützt. Bitte Text eingeben.",
    noSpeech: "Keine Sprache erkannt. Bitte erneut versuchen oder Text eingeben.",
    unavailable: "Mikrofon nicht verfügbar. Nutze einen Browser mit Spracherkennung auf HTTPS oder localhost. Texteingabe funktioniert weiterhin."
  },
  fa: {
    uiLanguage: "زبان صفحه",
    title: "آلمانی ↔ فارسی",
    intro: "متن خود را بنویسید یا بگویید. زبان مقصد به‌صورت خودکار تشخیص داده می‌شود.",
    message: "متن شما",
    placeholder: "متن را به آلمانی یا فارسی وارد کنید",
    speechLanguage: "زبان گفتار برای میکروفون",
    german: "آلمانی",
    persian: "فارسی",
    speak: "صحبت کنید",
    stop: "توقف ضبط",
    clear: "پاک کردن",
    translate: "ترجمه کنید",
    translation: "ترجمه",
    attribution: "قدرت‌گرفته از بهراد",
    privacy: "دسترسی به میکروفون به HTTPS یا localhost و مرورگر سازگار نیاز دارد. بسته به مرورگر، صدای شما ممکن است توسط یک سرویس خارجی پردازش شود. فقط متن تشخیص‌داده‌شده به این برنامه ارسال می‌شود.",
    blank: "ابتدا متنی بنویسید یا صحبت کنید.",
    translating: "در حال ترجمه ...",
    complete: "ترجمه آماده است.",
    serverError: "ترجمه ناموفق بود. کد خطای سرور: {code}.",
    emptyResponse: "سرور ترجمه‌ای برنگرداند.",
    requestError: "ترجمه ناموفق بود. اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.",
    timeout: "ترجمه بیش از حد طول کشید. لطفاً دوباره تلاش کنید.",
    listening: "لطفاً اکنون صحبت کنید ...",
    microphoneError: "میکروفون شروع به کار نکرد. مجوز دسترسی را بررسی کنید و دوباره تلاش کنید.",
    speechError: "تشخیص گفتار ناموفق بود. دوباره تلاش کنید یا متن را بنویسید.",
    permissionError: "دسترسی به میکروفون مجاز نیست. مجوز مرورگر را بررسی کنید یا متن را بنویسید.",
    speechNetworkError: "سرویس تشخیص گفتار در دسترس نیست. اتصال اینترنت را بررسی کنید یا متن را بنویسید.",
    speechLanguageError: "تشخیص گفتار از این زبان پشتیبانی نمی‌کند. لطفاً متن را بنویسید.",
    noSpeech: "گفتاری تشخیص داده نشد. دوباره تلاش کنید یا متن را بنویسید.",
    unavailable: "میکروفون در دسترس نیست. از مرورگری با قابلیت تشخیص گفتار روی HTTPS یا localhost استفاده کنید. همچنان می‌توانید متن را بنویسید."
  }
};
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const canRecord = Boolean(SpeechRecognition) && window.isSecureContext;
let recording = false;
let translating = false;
let currentStatus = null;

function showStatus(key, error = false, values = {}) {
  currentStatus = { key, error, values };
  status.textContent = strings[uiLanguage.value][key].replace(
    /\{(\w+)\}/g, (_, name) => String(values[name])
  );
  status.dataset.error = String(error);
}

function updateLocale() {
  const locale = uiLanguage.value;
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "fa" ? "rtl" : "ltr";
  document.title = strings[locale].title;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = strings[locale][element.dataset.i18n];
  });
  message.placeholder = strings[locale].placeholder;
  message.setCustomValidity("");
  if (currentStatus) {
    showStatus(currentStatus.key, currentStatus.error, currentStatus.values);
  }
}

uiLanguage.addEventListener("change", updateLocale);
updateLocale();
message.addEventListener("invalid", () => {
  message.setCustomValidity(strings[uiLanguage.value].blank);
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
  currentStatus = null;
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
