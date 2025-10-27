// React & styles
import { useRef } from "react";
import WindowOverlay from "./WindowOverlay"; // Added: overlay wrapper
import "../styles/Credits.css";
import "../styles/ScrollArrows.css";
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
      <div className="window window-credits has-scroll-parent">
        {/* Scrollable content area */}
        <div ref={scrollRef} className="window-credits-content has-scroll">
          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.writing")}
            </h3>
            <p className="window-credits-content-section-entry">
              {t("credits.names.rolando")}
            </p>
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.editing")}
            </h3>
            <p className="window-credits-content-section-entry">
              {t("credits.names.valentina")}
            </p>
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.music")}
            </h3>
            <p className="window-credits-content-section-entry">
              {t("credits.musicInfo.title")}
            </p>
            <p className="window-credits-content-section-entry">
              {t("credits.musicInfo.site")}
            </p>
            <p className="window-credits-content-section-entry">
              {t("credits.musicInfo.license")}
            </p>
          </section>

          {/* Font section */}
          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.font")}
            </h3>
            
            <p className="window-credits-content-section-entry">
              {t("credits.fontInfo.note")}
            </p>
            <p className="window-credits-content-section-entry">
              {t("credits.fontInfo.license")}
            </p>
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.playtesters")}
            </h3>
            {playtesters.map((name, i) => (
              <p key={i} className="window-credits-content-section-entry">
                {name}
              </p>
            ))}
          </section>

          <section className="window-credits-content-section">
            <h3 className="window-credits-content-section-header">
              {t("credits.sections.specialThanks")}
            </h3>
            {specialThanks.map((name, i) => (
              <p key={i} className="window-credits-content-section-entry">
                {name}
              </p>
            ))}
          </section>

          <p className="window-credits-content-footer">
            © 2025 Rolando André Hernández —{" "}
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