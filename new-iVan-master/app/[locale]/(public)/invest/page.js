"use client";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { BiSolidDashboard } from "react-icons/bi";
import { BsFillPlayBtnFill } from "react-icons/bs";
import { TbAntennaBars5 } from "react-icons/tb";
import { RiGlobalLine } from "react-icons/ri";


export default function InvestPage() {
  const router = useRouter();
  const t = useTranslations("PublicPages.invest");

  const handleViewCampaign = () => {
    router.push("/invest/campaign");
  };

  return (
    <div className="py-[24px] bg-[#08172E]">
      <div className=" py-18 bg-gradient-to-b from-[#042D49] to-[#064f6d]">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6 mb-4 mb-lg-0">
              <h1 className="text-white mb-4 fw-bold text-5xl">
                Invest in Swipped – The One World Ecosystem
              </h1>
              <p className="text-white mb-4 text-lg">
                Be part of building the world's first super-app ecosystem
                combining services, bookings, workforce, social, virtual land,
                AI and mini-apps – all in one.
              </p>

              <div
                className="mb-3 position-relative"
                style={{ display: "inline-block" }}
              >
                <button
                  onClick={handleViewCampaign}
                  className="px-8 py-3 rounded-xl font-semibold 
                  text-white  hover:bg-[#042F4B] bg-[#1352B0] flex items-center !cursor-pointer transition-all duration-300 "
                >
                  <i className="fa fa-play me-2" aria-hidden="true"></i>
                  Our Crowdfunding Campaign
                </button>
              </div>

              <p
                className="text-white-50 mb-0"
                style={{
                  fontSize: "0.9rem",
                  marginTop: "0.5rem",
                }}
              >
                Investments are processed securely through our official
                crowdfunding partner.
              </p>
            </div>

            <div className="col-lg-6 text-center">
              <div className="d-flex justify-content-center align-items-center">
                <img
                  src="/assets/img/swippedphone.png"
                  alt="Swipped app categories on smartphone"
                  className="img-fluid"
                  style={{
                    maxWidth: "100%",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container py-24">
        <div className="heading_box !pb-5">
          <h2
            className="mb-4"
            style={{
              color: "#00b4d8",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: "700",
            }}
          >
            Why We're Raising Investment
          </h2>
          <p className="text-white mb-5 w-full max-w-[900px]">
            Swipped is already built and live. We're now raising funds to expand
            across cities, onboard thousands of service providers, refine the
            design, and launch new mini-apps. Your support accelerates growth
            and helps us scale into a global ecosystem.
          </p>
        </div>
        <div className="row g-4">
          <div className="col-md-6 col-lg-3">
            <div className="h-100 p-4 rounded-4 !bg-[#F6F7FB]">
              <div className="custom-icon-box">
                <BiSolidDashboard className="text-[#1C5C9D] text-5xl" />
              </div>
              <h4 className="my-3 font-bold text-[#0a1929]">A Real Solution</h4>
              <p className="mb-0 text-[#0a1929]">
                One app for everything; Taxis, services, bookings, dating
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="h-100 p-4 rounded-4 !bg-[#F6F7FB]">
              <div className="custom-icon-box">
                <BsFillPlayBtnFill className="text-[#1C5C9D] text-5xl" />
              </div>
              <h4 className="my-3 font-bold text-[#0a1929]">Already Live</h4>
              <p className="mb-0 text-[#0a1929]">
                The main platform is built and functioning, with it past the
                initial development phase
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="h-100 p-4 rounded-4 !bg-[#F6F7FB]">
              <div className="custom-icon-box">
                <TbAntennaBars5 className="text-[#1C5C9D] text-5xl" />
              </div>
              <h4 className="my-3 font-bold text-[#0a1929]">
                Multiple Revenue Streams
              </h4>
              <p className="mb-0 text-[#0a1929]">
                Booking fees, premium features, subscriptions, and more
              </p>
            </div>
          </div>

          <div className="col-md-6 col-lg-3">
            <div className="h-100 p-4 rounded-4 !bg-[#F6F7FB]">
              <div className="custom-icon-box">
                <RiGlobalLine className="text-[#1C5C9D] text-5xl" />
              </div>
              <h4 className="my-3 font-bold text-[#0a1929]">Global Vision</h4>
              <p className="mb-0 text-[#0a1929]">
                Targeting multi-country rollout and incubation in the UK
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
