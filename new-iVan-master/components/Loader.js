import { useLottie } from "lottie-react";
import React from "react";
import groovyWalkAnimation from "../public/assets/img/loader.json";

export default function Loader() {
  const options = {
    animationData: groovyWalkAnimation,
    loop: true,
    autoplay: true,
  };
  const { View } = useLottie(options);

  return <>{View}</>;
}
