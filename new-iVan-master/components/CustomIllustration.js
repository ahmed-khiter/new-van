"use client";
import Image from "next/image";
import Link from "next/link";
import InterviewIllustration from "../public/assets/img/add interview.svg";
import TeamMemberIllustration from "../public/assets/img/add member.svg";
import JobIllustration from "../public/assets/img/open job.svg";
function CustomIllustration(props) {
    const { onClick, illustrationHelperText, buttonText, page, subscriptionMessage } = props;
    const illustrationSrc =
        page === "jobs" || page === "verifications"
            ? JobIllustration
            : page === "interviews"
                ? InterviewIllustration
                : page === "providers"
                    ? TeamMemberIllustration
                    : TeamMemberIllustration;
    return (
        <div className="col-12 d-flex justify-content-center align-items-center">
            <div className="mt-3">
                <Image
                    src={illustrationSrc}
                    height={180}
                    width={180}
                    className="m-auto"
                    alt={`${page} illustration`}
                />
                <p className="mt-4 text-center">
                    {subscriptionMessage || illustrationHelperText}
                </p>
                {buttonText && (
                    <button
                        className="btn btn-primary mb-2 mt-4 mx-auto d-block"
                        onClick={onClick}
                    >
                        {buttonText}
                    </button>
                )}
            </div>
        </div>
    );
}

export default CustomIllustration;
