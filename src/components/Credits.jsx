// React & styles
import { useRef } from "react";
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

  return (
    // Outer container stays fixed size, inner content scrolls
    <div className="window window-credits has-scroll-parent">
      {/* Close button in the top-right corner */}
      <button className="window-close" onClick={onClose}>
        ×
      </button>

      {/* Scrollable content area */}
      <div ref={scrollRef} className="credits-scroll has-scroll">
        <section className="window-credits-section">
          <h3 className="window-credits-section-header">{t("credits.sections.writing")}</h3>
          <p className="window-credits-section-entry">{t("credits.names.rolando")}</p>
        </section>

        <section className="window-credits-section">
          <h3 className="window-credits-section-header">{t("credits.sections.editing")}</h3>
          <p className="window-credits-section-entry">{t("credits.names.valentina")}</p>
        </section>

        <section className="window-credits-section">
          <h3 className="window-credits-section-header">{t("credits.sections.music")}</h3>
          <p className="window-credits-section-entry">{t("credits.musicInfo.title")}</p>
          <p className="window-credits-section-entry">{t("credits.musicInfo.site")}</p>
          <p className="window-credits-section-entry">{t("credits.musicInfo.license")}</p>
        </section>

        <section className="window-credits-section">
          <h3 className="window-credits-section-header">{t("credits.sections.specialThanks")}</h3>
          <p className="window-credits-section-entry">{t("credits.specialThanks")}</p>
        </section>

        <p className="credits-footer">{t("credits.copyright")}</p>
      </div>
    </div>
  );
}