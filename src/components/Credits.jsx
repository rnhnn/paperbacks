// React & styles
import "../styles/Credits.css";
import useText from "../hooks/useText";

export default function Credits({ onClose }) {
  const { t } = useText();

  return (
    <div className="window window-credits">
      {/* Close button in the top-right corner */}
      <button className="window-close" onClick={onClose}>
        ×
      </button>

      <section>
        <h3>{t("credits.sections.writing")}</h3>
        <p>{t("credits.names.rolando")}</p>
      </section>

      <section>
        <h3>{t("credits.sections.editing")}</h3>
        <p>{t("credits.names.valentina")}</p>
      </section>

      <section>
        <h3>{t("credits.sections.music")}</h3>
        <p>{t("credits.musicInfo.title")}</p>
        <p>{t("credits.musicInfo.site")}</p>
        <p>{t("credits.musicInfo.license")}</p>
      </section>

      <section>
        <h3>{t("credits.sections.specialThanks")}</h3>
        <p>{t("credits.specialThanks")}</p>
      </section>

      <p className="credits-footer">{t("credits.copyright")}</p>
    </div>
  );
}