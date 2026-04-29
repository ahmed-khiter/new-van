"use client";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  AiOutlineArrowLeft,
  AiOutlineUser,
  AiOutlineFileText,
  AiOutlineCheckCircle,
} from "react-icons/ai";

export default function CampaignPage() {
  const router = useRouter();
  const t = useTranslations("PublicPages.invest");

  const handleViewCampaign = () => {
    window.open("#", "_blank");
  };

  return (
    <div className="min-h-100 pt-0 bg-[#08172E]">
      <div className="py-14 bg-gradient-to-b from-[#042D49] to-[#064f6d] sm:py-24">
        <div className="container">
          <div className="row align-items-center g-4">
            {/* LEFT SIDE */}
            <div className="col-sm-12 col-md-6 col-lg-6">
              {/* Back Button */}
              <button
                onClick={() => router.back()}
                className="btn p-0 d-flex align-items-center gap-2 mb-4 text-white"
                style={{ fontSize: "1rem" }}
              >
                <AiOutlineArrowLeft size={22} />
                Back
              </button>

              {/* Title */}
              <h1 className="text-white mb-4 text-5xl font-bold max-w-[200px]">
                Our Live Crowdfunding Campaign
              </h1>

              {/* Button */}
              <button
                onClick={handleViewCampaign}
                className="btn text-white px-4 py-3 rounded-3 mb-5 hover:!bg-[#042F4B] !bg-[#1352B0] "
                style={{
                  boxShadow: "0 6px 20px rgba(0,123,255,0.4)",
                }}
              >
                View Our Selected <br />
                Crowdfunding Campaign
              </button>
            </div>

            {/* RIGHT SIDE — Campaign Widget */}
            <div className="col-sm-12 col-md-6 col-lg-6 ">
              <div
                className="p-4 shadow-lg"
                style={{
                  borderRadius: "14px",
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(20px)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {/* Window dots */}
                <div className="d-flex gap-2 mb-3">
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#4dafff",
                    }}
                  ></span>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#4dafff",
                    }}
                  ></span>
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      background: "#4dafff",
                    }}
                  ></span>
                </div>

                {/* Title */}
                <h2
                  className="text-white mb-3"
                  style={{ fontSize: "1.8rem", fontWeight: "700" }}
                >
                  Crowdfunding Campaign
                </h2>

                {/* Inner Card */}
                <div
                  className="p-3"
                  style={{
                    background: "rgba(20,40,70,0.6)",
                    borderRadius: "12px",
                  }}
                >
                  <p
                    className="text-white mb-0"
                    style={{ fontSize: "1.3rem", fontWeight: "600" }}
                  >
                    Support Swipped
                  </p>

                  <p className="text-white-50" style={{ fontSize: "0.9rem" }}>
                    on [Crowdfunding Platform]
                  </p>

                  {/* Progress bar */}
                  <div
                    className="progress mb-3"
                    style={{
                      height: "12px",
                      background: "rgba(255,255,255,0.15)",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      className="progress-bar"
                      style={{
                        width: "80%",
                        background: "#4dafff",
                        borderRadius: "8px",
                      }}
                    ></div>
                  </div>

                  {/* Metrics */}
                  <div className="d-flex justify-content-between text-white">
                    <div>
                      <h4 className="mb-0" style={{ fontWeight: "700" }}>
                        €600.000
                      </h4>
                      <small className="text-white-50">raised</small>
                    </div>

                    <div>
                      <h4 className="mb-0" style={{ fontWeight: "700" }}>
                        80%
                      </h4>
                      <small className="text-white-50">funded</small>
                    </div>

                    <div>
                      <h4 className="mb-0" style={{ fontWeight: "700" }}>
                        45
                      </h4>
                      <small className="text-white-50">days left</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 pb-6">
        <div className="container">
          {/* How to Invest Section */}
          <h2 className="text-white mb-4 text-4xl font-semibold ">
            How to Invest
          </h2>

          <div className="row g-4">
            {/* Step 1 */}
            <div className="col-md-4">
              <div className="p-4 text-center shadow-sm bg-white rounded-4 h-100">
                <div
                  className="mx-auto mb-3 d-flex align-items-center 
                  justify-content-center w-[60px] h-[60px] rounded-full bg-[#e8f3ff] "
                >
                  <AiOutlineUser size={32} className="text-primary" />
                </div>

                <p className="text-dark mb-0 font-semibold">
                  Create or log in <br /> to crowdfunding <br /> account
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="col-md-4">
              <div className="p-4 text-center shadow-sm bg-white rounded-4 h-100">
                <div
                  className="mx-auto mb-3 d-flex align-items-center 
                  justify-content-center w-[60px] h-[60px] rounded-full bg-[#e8f3ff] "
                >
                  <AiOutlineFileText size={32} className="text-primary" />
                </div>

                <p className="text-dark mb-0 font-semibold">
                  Verify identity <br /> as per requirements
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="col-md-4">
              <div className="p-4 text-center shadow-sm bg-white rounded-4 h-100">
                <div
                  className="mx-auto mb-3 d-flex align-items-center 
                  justify-content-center w-[60px] h-[60px] rounded-full bg-[#e8f3ff] "
                >
                  <AiOutlineCheckCircle size={32} className="text-primary" />
                </div>

                <p className="text-dark mb-0 font-semibold">
                  Invest in <br /> Swipped’s campaign
                </p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-white-50 pt-20" style={{ fontSize: "0.85rem" }}>
            Investing carries risks, please review terms, conditions, and risk
            factors before making any investment.
          </p>
        </div>
      </div>
    </div>
  );
}
