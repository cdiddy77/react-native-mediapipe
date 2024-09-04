// the way the standard docusaurus file use .require upsets the linter, turn that warning off
/* eslint @typescript-eslint/no-var-requires: "off" */
/* eslint @typescript-eslint/no-unsafe-assignment: "off" */

import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg?: React.ComponentType<React.ComponentProps<"svg">>;
  linkLabel: string;
  link: string;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Installation",
    linkLabel:
      "Getting Started: Integrate React Native MediaPipe into your project.",
    link: "/react-native-mediapipe/docs/intro",
  },
  {
    title: "Object Detection",
    linkLabel:
      "Getting Started: Track and categorize objects using your mobile camera.",
    link: "/react-native-mediapipe/docs/api_pages/object-detection",
  },
  {
    title: "Face Landmark Detection",
    linkLabel:
      "Getting Started: Captures main facial points and expressions in real-time.",
    link: "/react-native-mediapipe/docs/api_pages/face-landmark-detection",
  },
];

function Feature({ title, Svg, link, linkLabel }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        {Svg && <Svg className={styles.featureSvg} role="img" />}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <p>{linkLabel}</p>
        </a>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
