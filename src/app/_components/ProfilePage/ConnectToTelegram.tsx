/*  eslint-disable @typescript-eslint/no-explicit-any */
/*  eslint-disable @typescript-eslint/no-unsafe-argument */

"use client";

import { api } from "@/trpc/react";
import { useState, useEffect } from "react";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

interface ConnectTelegramButtonProps {
  isTelegramConnected?: boolean;
}

export default function ConnectTelegramButton({
  isTelegramConnected = false,
}: ConnectTelegramButtonProps) {
  const telegramLogin = api.user.linkToTelegram.useMutation();

  useEffect(() => {
    window.onTelegramAuth = function (user: any) {
      console.log("telegram payload", user);
      // explicitly ignore the promise return to satisfy lint
      void (async () => {
        try {
          // tRPC call
          const result = await telegramLogin.mutateAsync(user);

          // optional legacy endpoint if needed
          await fetch("/api/auth/telegram", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(user),
          });

          window.location.href = "/profile";
        } catch (err) {
          console.error("Telegram login failed", err);
          // show some UI feedback if desired
        }
      })();
    };
  }, [telegramLogin]);

  useEffect(() => {
    const container = document.getElementById("telegram-widget-container");
    if (!container) return;

    container.innerHTML = ""; // reset

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", "cordy_sandbot"); // no "@"
    script.setAttribute("data-size", "large");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    container.appendChild(script);
  }, []);

  return (
    <div>
      <div id="telegram-widget-container" className="mt-2" />
    </div>
  );
}
