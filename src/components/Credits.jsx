// Display a scrollable credits window with HTML-enabled entries and custom scroll arrows

// Styles
import "../styles/Credits.css";
import "../styles/ScrollArrows.css";

// React
import { useRef } from "react";

// Components
import WindowOverlay from "./WindowOverlay";

// Hooks
import useText from "../hooks/useText";
import useScrollArrows from "../hooks/useScrollArrows";

export default function Credits({ onClose }) {
  const { t } = useText();

  // Keep a ref to the scrollable area
  const scrollRef = useRef(null);

  // Enable custom scroll arrows
  useScrollArrows(scrollRef, { step: 24 });

  // Get arrays safely from translation data
  const specialThanks = t("credits.specialThanks", { returnObjects: true }) || [];
  const playtesters = t("credits.playtesters", { returnObjects: true }) || [];

  // Render credits inside window overlay
  return (
    <WindowOverlay onClose={onClose}>
      {/* Outer container stays fixed size, inner content scrolls */}
      <div className="window window-credits has-pixelated-corners has-scroll-parent">
        {/* Scrollable content area */}
        <div ref={scrollRef} className="window-credits-content has-pixelated-corners has-scroll">
          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.writing")}
            </h3>
            <p
              className="window-credits-content-section-entry"
              dangerouslySetInnerHTML={{ __html: t("credits.names.rolando") }}
            />
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.editing")}
            </h3>
            <p
              className="window-credits-content-section-entry"
              dangerouslySetInnerHTML={{ __html: t("credits.names.valentina") }}
            />
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.playtesters")}
            </h3>
            {playtesters.map((name, i) => (
              <p
                key={i}
                className="window-credits-content-section-entry"
                dangerouslySetInnerHTML={{ __html: name }}
              />
            ))}
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.music")}
            </h3>
            <p
              className="window-credits-content-section-entry"
              dangerouslySetInnerHTML={{ __html: t("credits.musicInfo.title") }}
            />
            <p
              className="window-credits-content-section-entry"
              dangerouslySetInnerHTML={{ __html: t("credits.musicInfo.site") }}
            />
            <p
              className="window-credits-content-section-entry"
              dangerouslySetInnerHTML={{ __html: t("credits.musicInfo.license") }}
            />
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.font")}
            </h3>
            <p
              className="window-credits-content-section-entry"
              dangerouslySetInnerHTML={{ __html: t("credits.fontInfo.note") }}
            />
            <p
              className="window-credits-content-section-entry"
              dangerouslySetInnerHTML={{ __html: t("credits.fontInfo.license") }}
            />
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.specialThanks")}
            </h3>
            {specialThanks.map((name, i) => (
              <p
                key={i}
                className="window-credits-content-section-entry"
                dangerouslySetInnerHTML={{ __html: name }}
              />
            ))}
          </section>

          <p className="window-credits-content-footer">
            © 2025 Indoor Prince —{" "}
            <a
              href="https://indoorprince.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              indoorprince.com
            </a>
          </p>
        </div>
      </div>
    </WindowOverlay>
  );
}