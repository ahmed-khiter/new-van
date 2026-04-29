"use client";
import { useTranslations } from "next-intl";

export default function PrivacyPolicyPage() {
  const t = useTranslations("PublicPages.privacy");

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body p-5">
              <h1 className="mb-4 text-center">{t("title")}</h1>
              <p className="text-muted text-center mb-5">{t("last_updated")}</p>

              <div className="privacy-content">
                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_1_title")}</h3>
                  <p>{t("section_1_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_2_title")}</h3>
                  <p>{t("section_2_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_3_title")}</h3>
                  <p>{t("section_3_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_4_title")}</h3>
                  <p>{t("section_4_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_5_title")}</h3>
                  <p>{t("section_5_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_6_title")}</h3>
                  <p>{t("section_6_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_7_title")}</h3>
                  <p>{t("section_7_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_8_title")}</h3>
                  <p>{t("section_8_content")}</p>
                </section>

                <section className="mb-4">
                  <h3 className="h4 mb-3">{t("section_9_title")}</h3>
                  <p>{t("section_9_content")}</p>
                </section>
              </div>

              <div className="text-center mt-5">
                <p className="text-muted">{t("contact_info")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
