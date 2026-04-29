"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function OpenApiDocsPage() {
  useEffect(() => {
    const initSwagger = () => {
      if (!window.SwaggerUIBundle || !window.SwaggerUIStandalonePreset) return false;

      window.SwaggerUIBundle({
        url: "/api/openapi",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true,
        presets: [window.SwaggerUIBundle.presets.apis, window.SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
      });

      return true;
    };

    if (initSwagger()) return;

    const interval = setInterval(() => {
      if (initSwagger()) clearInterval(interval);
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <main style={{ minHeight: "100vh", background: "#fafafa" }}>
      <link
        rel="stylesheet"
        href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
      />
      <div id="swagger-ui" />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"
        strategy="afterInteractive"
      />
    </main>
  );
}
