"use client";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";

export default function AboutPage() {
  const router = useRouter();
  const t = useTranslations("PublicPages.about");

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Header Section */}
          <div className="mb-5">
            <button
              onClick={() => router.back()}
              className="btn btn-link text-decoration-none p-0 mb-3"
              style={{ color: "#6c757d" }}
            >
              <i className="fa fa-arrow-left me-2" aria-hidden="true"></i>
              Back
            </button>
            <h1 className="mb-3">{t("title")}</h1>
          </div>

          {/* Hero Image */}
          <div className="mb-5" style={{ height: "400px", overflow: "hidden", borderRadius: "8px" }}>
            <img
              src="/assets/img/about-us.jpg"
              alt="About Us"
              className="w-100 h-100"
              style={{ objectFit: "cover" }}
            />
          </div>

          {/* Content Section */}
          <div className="card shadow-sm border-0">
            <div className="card-body p-5">
              <div className="about-content">
                <section className="mb-5 pb-4 border-bottom">
                  <h3 className="h4 mb-3 fw-bold">{t("section_1_title")}</h3>
                  <p className="text-muted mb-0" style={{ lineHeight: "1.8" }}>{t("section_1_content")}</p>
                </section>

                <section className="mb-5 pb-4 border-bottom">
                  <h3 className="h4 mb-3 fw-bold">{t("section_2_title")}</h3>
                  <p className="text-muted mb-0" style={{ lineHeight: "1.8" }}>{t("section_2_content")}</p>
                </section>

                <section className="mb-5 pb-4 border-bottom">
                  <h3 className="h4 mb-3 fw-bold">{t("section_3_title")}</h3>
                  <p className="text-muted mb-0" style={{ lineHeight: "1.8" }}>{t("section_3_content")}</p>
                </section>

                <section className="mb-5 pb-4 border-bottom">
                  <h3 className="h4 mb-3 fw-bold">{t("section_4_title")}</h3>
                  <p className="text-muted mb-0" style={{ lineHeight: "1.8" }}>{t("section_4_content")}</p>
                </section>

                <section className="mb-5">
                  <h3 className="h4 mb-3 fw-bold">{t("section_5_title")}</h3>
                  <p className="text-muted mb-0" style={{ lineHeight: "1.8" }}>{t("section_5_content")}</p>
                </section>

                {t("contact_info") && (
                  <div className="text-center mt-5 pt-4 border-top">
                    <p className="text-muted mb-0" style={{ fontSize: "1.1rem" }}>{t("contact_info")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

