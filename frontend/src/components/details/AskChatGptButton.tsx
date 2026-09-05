import { useRef, useState } from "react";

const POPUP_WIDTH = 420;
const POPUP_HEIGHT = 640;
const POPUP_NAME = "chatgpt-popup";

export function AskChatGptButton() {
  const popupRef = useRef<Window | null>(null);
  const [blocked, setBlocked] = useState(false);

  function handleClick() {
    if (popupRef.current && !popupRef.current.closed) {
      popupRef.current.focus();
      return;
    }

    const left = Math.max(0, window.screen.availWidth - POPUP_WIDTH - 24);
    const top = Math.max(0, window.screen.availHeight - POPUP_HEIGHT - 24);
    const features = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},noopener,noreferrer`;

    const popup = window.open("https://chatgpt.com/", POPUP_NAME, features);
    if (!popup) {
      setBlocked(true);
      return;
    }
    setBlocked(false);
    popupRef.current = popup;
  }

  return (
    <div className="fixed bottom-20 right-6 z-30 flex flex-col items-end gap-2 sm:bottom-6 sm:z-50">
      {blocked && (
        <div className="max-w-[220px] rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800 shadow">
          Your browser blocked the popup. Please allow popups for this site and try again.
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        aria-label="Ask ChatGPT"
        title="Ask ChatGPT"
        className="rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-emerald-500"
      >
        💬 Ask ChatGPT
      </button>
    </div>
  );
}
