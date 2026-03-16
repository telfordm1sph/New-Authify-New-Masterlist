import React from "react";
import "../css/app.css";
import "./bootstrap";
import { createRoot } from "react-dom/client";
import { createInertiaApp, router } from "@inertiajs/react";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { Toaster } from "sonner";
import axios from "axios";

// Read CSRF from meta tag — same as Blade @csrf hidden input
axios.defaults.headers.common["X-CSRF-TOKEN"] = document.head.querySelector(
    'meta[name="csrf-token"]',
)?.content;

axios.defaults.withCredentials = true;

router.on("invalid", (event) => {
    event.preventDefault();
    window.location.href = event.detail.response.url ?? "/";
});

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 419) {
            window.location.reload();
        }
        return Promise.reject(error);
    },
);

createInertiaApp({
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob("./Pages/**/*.jsx"),
        ),
    setup({ el, App, props }) {
        createRoot(el).render(
            <>
                <Toaster richColors position="top-center" />
                <App {...props} />
            </>,
        );
    },
});
